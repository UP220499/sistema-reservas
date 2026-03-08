import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, cliente, cliente_telefono } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ClientsRepository } from './prisma/clients.repository';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AddPhoneDto } from './dto/add-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { LoyaltyInfo, computeLoyalty } from './loyalty/loyalty';
import { BLOCKING_CLIENT_DEACTIVATION_STATUSES } from '../../shared/reservation-statuses';

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async findAll(query: ClientQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const and: Prisma.clienteWhereInput[] = [];

    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      const normalizedDigits = this.normalizePhone(trimmedSearch);
      const orConditions: Prisma.clienteWhereInput['OR'] = [
        { nombre: { contains: trimmedSearch, mode: 'insensitive' } },
        { correo: { contains: trimmedSearch, mode: 'insensitive' } },
      ];

      if (normalizedDigits) {
        orConditions.push({
          cliente_telefono: {
            some: {
              telefono: {
                contains: normalizedDigits,
              },
            },
          },
        });
      }

      and.push({ OR: orConditions });
    }

    const where: Prisma.clienteWhereInput = {
      ...(query.active !== undefined ? { activo: query.active } : {}),
      ...(and.length > 0 ? { AND: and } : {}),
    };

    const [items, total] = await Promise.all([
      this.clientsRepository.findManyPaged(where, skip, pageSize),
      this.clientsRepository.count(where),
    ]);

    // Single groupBy query — no N+1
    const clienteIds = items.map((c) => c.cliente_id);
    const loyaltySums = await this.clientsRepository.getLoyaltySums(clienteIds);

    return {
      items: items.map((item) => {
        const ls = loyaltySums.get(item.cliente_id);
        return this.mapClientSummary(
          item,
          computeLoyalty(ls?.count ?? 0, ls?.monto ?? new Prisma.Decimal(0)),
        );
      }),
      page,
      page_size: pageSize,
      total,
    };
  }

  async findOne(clientId: string) {
    const id = this.parseId(clientId, 'clientId');

    const [client, loyaltyTotal] = await Promise.all([
      this.clientsRepository.findById(id),
      this.clientsRepository.getLoyaltySum(id),
    ]);

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.mapClientDetail(
      client,
      computeLoyalty(loyaltyTotal.count, loyaltyTotal.monto),
    );
  }

  async create(dto: CreateClientDto) {
    if (!dto.phones?.length) {
      throw new BadRequestException('At least one phone number is required');
    }

    const normalizedPhones = dto.phones.map((phone) => ({
      telefono: this.normalizeAndValidatePhone(phone.telefono),
      es_principal: phone.es_principal ?? false,
    }));

    this.ensureUniquePhones(normalizedPhones.map((phone) => phone.telefono));

    let primaryIndex = normalizedPhones.findIndex(
      (phone) => phone.es_principal,
    );
    if (primaryIndex === -1) {
      primaryIndex = 0;
    }

    const phonesData = normalizedPhones.map((phone, index) => ({
      telefono: phone.telefono,
      es_principal: index === primaryIndex,
      activo: true,
    }));

    const created = await this.clientsRepository.createClient({
      nombre: dto.nombre,
      correo: dto.correo ?? null,
      activo: true,
      cliente_telefono: {
        create: phonesData,
      },
    });

    const [client, loyaltyTotal] = await Promise.all([
      this.clientsRepository.findById(created.cliente_id),
      this.clientsRepository.getLoyaltySum(created.cliente_id),
    ]);

    if (!client) {
      throw new NotFoundException('Client not found after creation');
    }

    return this.mapClientDetail(
      client,
      computeLoyalty(loyaltyTotal.count, loyaltyTotal.monto),
    );
  }

  async update(clientId: string, dto: UpdateClientDto) {
    const id = this.parseId(clientId, 'clientId');

    const data: Prisma.clienteUpdateInput = {};
    if (dto.nombre !== undefined) {
      data.nombre = dto.nombre;
    }

    if (dto.correo !== undefined) {
      data.correo = dto.correo;
    }

    if (!Object.keys(data).length) {
      return this.findOne(clientId);
    }

    try {
      await this.clientsRepository.updateClient(id, data);
    } catch (error) {
      this.handleNotFound(error, 'Client not found');
      throw error;
    }

    return this.findOne(clientId);
  }

  async changeStatus(clientId: string, active: boolean) {
    if (typeof active !== 'boolean') {
      throw new BadRequestException('active must be a boolean value');
    }

    const id = this.parseId(clientId, 'clientId');

    const prisma = this.clientsRepository.prismaClient;

    try {
      await prisma.$transaction(async (tx) => {
        const client = await tx.cliente.findUnique({
          where: { cliente_id: id },
        });

        if (!client) {
          throw new NotFoundException('Client not found');
        }

        if (!active) {
          const activeReservationsCount = await tx.reserva.count({
            where: {
              cliente_id: id,
              estatus_reserva_code: {
                in: [...BLOCKING_CLIENT_DEACTIVATION_STATUSES],
              },
            },
          });

          if (activeReservationsCount > 0) {
            throw new ConflictException({
              message:
                'Client has active reservations and cannot be deactivated',
              active_reservations_count: activeReservationsCount,
            });
          }
        }

        if (active) {
          const activePhones = await tx.cliente_telefono.count({
            where: { cliente_id: id, activo: true },
          });

          if (activePhones === 0) {
            throw new BadRequestException(
              'Active clients must have at least one active phone',
            );
          }
        }

        await tx.cliente.update({
          where: { cliente_id: id },
          data: { activo: active },
        });
      });
    } catch (error) {
      this.handleNotFound(error, 'Client not found');
      throw error;
    }

    return this.findOne(clientId);
  }

  async addPhone(clientId: string, dto: AddPhoneDto) {
    const id = this.parseId(clientId, 'clientId');
    const telefono = this.normalizeAndValidatePhone(dto.telefono);
    const esPrincipal = dto.es_principal ?? false;

    const prisma = this.clientsRepository.prismaClient;

    try {
      await prisma.$transaction(async (tx) => {
        const client = await tx.cliente.findUnique({
          where: { cliente_id: id },
        });

        if (!client) {
          throw new NotFoundException('Client not found');
        }

        // Check for an existing row with the same number regardless of activo.
        const existing = await tx.cliente_telefono.findFirst({
          where: { cliente_id: id, telefono },
        });

        if (existing) {
          if (existing.activo) {
            throw new BadRequestException(
              'Phone number already exists for client',
            );
          }

          // Reactivate the inactive row.
          await tx.cliente_telefono.update({
            where: { cliente_telefono_id: existing.cliente_telefono_id },
            data: { activo: true },
          });

          if (esPrincipal) {
            await tx.cliente_telefono.updateMany({
              where: {
                cliente_id: id,
                cliente_telefono_id: { not: existing.cliente_telefono_id },
              },
              data: { es_principal: false },
            });
            await tx.cliente_telefono.update({
              where: { cliente_telefono_id: existing.cliente_telefono_id },
              data: { es_principal: true },
            });
          }
          // else: keep the row's existing es_principal value unchanged.
          return;
        }

        // Phone does not exist — create a new row.
        const created = await tx.cliente_telefono.create({
          data: {
            cliente_id: id,
            telefono,
            es_principal: esPrincipal,
            activo: true,
          },
        });

        if (esPrincipal) {
          await tx.cliente_telefono.updateMany({
            where: {
              cliente_id: id,
              cliente_telefono_id: { not: created.cliente_telefono_id },
            },
            data: { es_principal: false },
          });
        } else {
          const existingPrincipal = await tx.cliente_telefono.findFirst({
            where: {
              cliente_id: id,
              activo: true,
              es_principal: true,
              cliente_telefono_id: { not: created.cliente_telefono_id },
            },
          });

          if (!existingPrincipal) {
            await tx.cliente_telefono.update({
              where: { cliente_telefono_id: created.cliente_telefono_id },
              data: { es_principal: true },
            });
          }
        }
      });
    } catch (error) {
      // Safety net for concurrent create race (P2002).
      this.handleUniqueViolation(
        error,
        'Phone number already exists for client',
      );
      this.handleNotFound(error, 'Client not found');
      throw error;
    }

    return this.findOne(clientId);
  }

  async updatePhone(clientId: string, phoneId: string, dto: UpdatePhoneDto) {
    const clientIdParsed = this.parseId(clientId, 'clientId');
    const phoneIdParsed = this.parseId(phoneId, 'phoneId');

    if (
      dto.telefono === undefined &&
      dto.activo === undefined &&
      dto.es_principal === undefined
    ) {
      return this.findOne(clientId);
    }

    const prisma = this.clientsRepository.prismaClient;

    try {
      await prisma.$transaction(async (tx) => {
        const client = await tx.cliente.findUnique({
          where: { cliente_id: clientIdParsed },
        });

        if (!client) {
          throw new NotFoundException('Client not found');
        }

        const phone = await tx.cliente_telefono.findUnique({
          where: { cliente_telefono_id: phoneIdParsed },
        });

        if (!phone || phone.cliente_id !== clientIdParsed) {
          throw new NotFoundException('Phone not found');
        }

        const data: Prisma.cliente_telefonoUpdateInput = {};

        if (dto.telefono !== undefined) {
          data.telefono = this.normalizeAndValidatePhone(dto.telefono);
        }

        if (dto.activo !== undefined) {
          data.activo = dto.activo;
        }

        if (dto.es_principal !== undefined) {
          data.es_principal = dto.es_principal;
        }

        await tx.cliente_telefono.update({
          where: { cliente_telefono_id: phoneIdParsed },
          data,
        });

        if (dto.es_principal === true) {
          await tx.cliente_telefono.updateMany({
            where: {
              cliente_id: clientIdParsed,
              cliente_telefono_id: { not: phoneIdParsed },
            },
            data: { es_principal: false },
          });
        }

        const activePhones = await tx.cliente_telefono.findMany({
          where: { cliente_id: clientIdParsed, activo: true },
          orderBy: [{ es_principal: 'desc' }, { cliente_telefono_id: 'asc' }],
        });

        if (!activePhones.length && client.activo) {
          throw new BadRequestException(
            'Active clients must have at least one active phone',
          );
        }

        const hasPrincipal = activePhones.some((item) => item.es_principal);

        if (!hasPrincipal && activePhones.length) {
          const replacement =
            activePhones.find(
              (item) => item.cliente_telefono_id !== phoneIdParsed,
            ) ?? activePhones[0];

          await tx.cliente_telefono.update({
            where: { cliente_telefono_id: replacement.cliente_telefono_id },
            data: { es_principal: true },
          });
        }
      });
    } catch (error) {
      this.handleUniqueViolation(
        error,
        'Phone number already exists for client',
      );
      this.handleNotFound(error, 'Client or phone not found');
      throw error;
    }

    return this.findOne(clientId);
  }

  async setPrimaryPhone(clientId: string, phoneId: string) {
    const clientIdParsed = this.parseId(clientId, 'clientId');
    const phoneIdParsed = this.parseId(phoneId, 'phoneId');

    const prisma = this.clientsRepository.prismaClient;

    try {
      await prisma.$transaction(async (tx) => {
        const phone = await tx.cliente_telefono.findUnique({
          where: { cliente_telefono_id: phoneIdParsed },
        });

        if (!phone || phone.cliente_id !== clientIdParsed) {
          throw new NotFoundException('Phone not found');
        }

        if (!phone.activo) {
          throw new BadRequestException(
            'Phone must be active to become primary',
          );
        }

        await tx.cliente_telefono.updateMany({
          where: { cliente_id: clientIdParsed },
          data: { es_principal: false },
        });

        await tx.cliente_telefono.update({
          where: { cliente_telefono_id: phoneIdParsed },
          data: { es_principal: true },
        });
      });
    } catch (error) {
      this.handleNotFound(error, 'Client or phone not found');
      throw error;
    }

    return this.findOne(clientId);
  }

  private parseId(value: string, field: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(
        `${field} must be a valid numeric identifier`,
      );
    }
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeAndValidatePhone(phone: string): string {
    const digits = this.normalizePhone(phone);
    // Strip MX country code when provided (52 + 10 digits = 12 digits total).
    const national =
      digits.length === 12 && digits.startsWith('52')
        ? digits.slice(2)
        : digits;

    if (national.length !== 10) {
      throw new BadRequestException('phone must have 10 digits');
    }

    return national;
  }

  private ensureUniquePhones(phones: string[]): void {
    const seen = new Set<string>();

    for (const phone of phones) {
      if (seen.has(phone)) {
        throw new BadRequestException(
          'Duplicate phone numbers are not allowed',
        );
      }

      seen.add(phone);
    }
  }

  private mapClientSummary(
    client: cliente & { cliente_telefono: cliente_telefono[] },
    loyalty: LoyaltyInfo,
  ) {
    const primaryPhone =
      client.cliente_telefono.find((p) => p.es_principal && p.activo)
        ?.telefono ??
      client.cliente_telefono.find((p) => p.activo)?.telefono ??
      null;

    return {
      cliente_id: client.cliente_id.toString(),
      nombre: client.nombre,
      correo: client.correo,
      activo: client.activo,
      primary_phone: primaryPhone,
      loyalty,
    };
  }

  private mapClientDetail(
    client: cliente & { cliente_telefono: cliente_telefono[] },
    loyalty: LoyaltyInfo,
  ) {
    return {
      cliente_id: client.cliente_id.toString(),
      nombre: client.nombre,
      correo: client.correo,
      activo: client.activo,
      phones: client.cliente_telefono.map((phone) => ({
        cliente_telefono_id: phone.cliente_telefono_id.toString(),
        telefono: phone.telefono,
        es_principal: phone.es_principal,
        activo: phone.activo,
      })),
      loyalty,
    };
  }

  private handleNotFound(error: unknown, message: string): void {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(message);
    }
  }

  private handleUniqueViolation(error: unknown, message: string): void {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(message);
    }
  }
}
