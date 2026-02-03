import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReservationsRepository } from './prisma/reservations.repository';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ChangeReservationStatusDto } from './dto/change-reservation-status.dto';
import {
  ReservationDetail,
  ReservationSummary,
  toReservationDetail,
  toReservationSummary,
} from './mappers/reservation.mapper';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  async findAll(query: ReservationQueryDto): Promise<{
    items: ReservationSummary[];
    page: number;
    page_size: number;
    total: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.reservationsRepository.findManyPaged(where, skip, pageSize),
      this.reservationsRepository.count(where),
    ]);

    return {
      items: items.map((item) => toReservationSummary(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async findOne(reservationId: string) {
    const id = this.parseId(reservationId, 'reservation_id');
    const reservation =
      await this.reservationsRepository.findReservationWithRelations(id);

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return toReservationDetail(reservation);
  }

  async create(
    dto: CreateReservationDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    const clienteId = this.parseId(dto.cliente_id, 'cliente_id');
    const ubicacionId = this.parseId(dto.ubicacion_id, 'ubicacion_id');

    const checkin = this.parseDate(dto.checkin_datetime, 'checkin_datetime');
    const checkout = this.parseDate(dto.checkout_datetime, 'checkout_datetime');

    if (checkout <= checkin) {
      throw new BadRequestException(
        'checkout_datetime must be greater than checkin_datetime',
      );
    }

    const totalReservaDecimal =
      dto.total_reserva !== undefined
        ? this.parseDecimal(dto.total_reserva, 'total_reserva')
        : undefined;

    const prisma = this.reservationsRepository.prismaClient;

    const created = await prisma.$transaction(async (tx) => {
      const client = await this.reservationsRepository.findActiveClient(
        tx,
        clienteId,
      );

      if (!client || !client.activo) {
        throw new NotFoundException('Active client not found');
      }

      const location = await this.reservationsRepository.findActiveLocation(
        tx,
        ubicacionId,
      );

      if (!location || !location.activa) {
        throw new NotFoundException('Active location not found');
      }

      const overlapping =
        await this.reservationsRepository.findOverlappingReservation(tx, {
          ubicacionId,
          checkin,
          checkout,
        });

      if (overlapping) {
        throw new BadRequestException(
          'The selected location is already booked for the given period',
        );
      }

      const reservation = await this.reservationsRepository.createReservation(
        tx,
        {
          cliente_id: clienteId,
          ubicacion_id: ubicacionId,
          checkin_datetime: checkin,
          checkout_datetime: checkout,
          estatus_reserva_code: dto.estatus_reserva_code ?? 'CONFIRMADA',
          origen_reserva_code: dto.origen_reserva_code,
          total_reserva: totalReservaDecimal,
          notas: dto.notas ?? null,
          created_by: auditUserId ?? undefined,
        },
      );

      if (auditUserId !== undefined) {
        await this.reservationsRepository.createReservationHistory(tx, {
          reserva: {
            connect: { reserva_id: reservation.reserva_id },
          },
          usuario: {
            connect: { usuario_id: auditUserId },
          },
          accion: 'CREAR',
        });
      }

      return reservation;
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(
        created.reserva_id,
      );

    if (!reservation) {
      throw new NotFoundException('Reservation not found after creation');
    }

    return toReservationDetail(reservation);
  }

  async update(
    reservationId: string,
    dto: UpdateReservationDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    const reservaId = this.parseId(reservationId, 'reservation_id');

    const prisma = this.reservationsRepository.prismaClient;

    await prisma.$transaction(async (tx) => {
      const existing = await this.reservationsRepository.findByIdForUpdate(
        tx,
        reservaId,
      );

      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      const nextCheckin = dto.checkin_datetime
        ? this.parseDate(dto.checkin_datetime, 'checkin_datetime')
        : existing.checkin_datetime;
      const nextCheckout = dto.checkout_datetime
        ? this.parseDate(dto.checkout_datetime, 'checkout_datetime')
        : existing.checkout_datetime;

      if (nextCheckout <= nextCheckin) {
        throw new BadRequestException(
          'checkout_datetime must be greater than checkin_datetime',
        );
      }

      const nextStatusCode =
        dto.estatus_reserva_code ?? existing.estatus_reserva_code;

      const statusRecord = await tx.cat_estatus_reserva.findUnique({
        where: { estatus_reserva_code: nextStatusCode },
        select: { bloquea_disponibilidad: true },
      });

      if (!statusRecord) {
        throw new BadRequestException('Invalid estatus_reserva_code');
      }

      const datesChanged =
        existing.checkin_datetime.getTime() !== nextCheckin.getTime() ||
        existing.checkout_datetime.getTime() !== nextCheckout.getTime();
      const statusChanged =
        dto.estatus_reserva_code !== undefined &&
        dto.estatus_reserva_code !== existing.estatus_reserva_code;

      if (
        statusRecord.bloquea_disponibilidad &&
        (datesChanged || statusChanged)
      ) {
        const overlapping =
          await this.reservationsRepository.findOverlappingReservation(tx, {
            ubicacionId: existing.ubicacion_id,
            checkin: nextCheckin,
            checkout: nextCheckout,
            excludeReservationId: reservaId,
          });

        if (overlapping) {
          throw new BadRequestException(
            'The selected location is already booked for the given period',
          );
        }
      }

      const data: Prisma.reservaUpdateInput = {};

      if (dto.checkin_datetime) {
        data.checkin_datetime = nextCheckin;
      }

      if (dto.checkout_datetime) {
        data.checkout_datetime = nextCheckout;
      }

      if (dto.estatus_reserva_code) {
        data.cat_estatus_reserva = {
          connect: { estatus_reserva_code: dto.estatus_reserva_code },
        };
      }

      if (dto.origen_reserva_code) {
        data.cat_origen_reserva = {
          connect: { origen_reserva_code: dto.origen_reserva_code },
        };
      }

      if (dto.total_reserva !== undefined) {
        data.total_reserva = this.parseDecimal(
          dto.total_reserva,
          'total_reserva',
        );
      }

      if (dto.notas !== undefined) {
        data.notas = dto.notas;
      }

      if (Object.keys(data).length === 0) {
        return;
      }

      await this.reservationsRepository.updateReservation(tx, reservaId, data);

      if (auditUserId !== undefined) {
        const action = datesChanged ? 'REAGENDAR' : 'ACTUALIZAR';

        await this.reservationsRepository.createReservationHistory(tx, {
          reserva: { connect: { reserva_id: reservaId } },
          usuario: { connect: { usuario_id: auditUserId } },
          accion: action,
          campo: datesChanged ? 'fechas' : undefined,
          valor_anterior: datesChanged
            ? `${existing.checkin_datetime.toISOString()}|${existing.checkout_datetime.toISOString()}`
            : undefined,
          valor_nuevo: datesChanged
            ? `${nextCheckin.toISOString()}|${nextCheckout.toISOString()}`
            : undefined,
        });
      }
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(reservaId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found after update');
    }

    return toReservationDetail(reservation);
  }

  async changeStatus(
    reservationId: string,
    dto: ChangeReservationStatusDto,
    auditUserId?: bigint,
  ): Promise<ReservationDetail> {
    const reservaId = this.parseId(reservationId, 'reservation_id');

    const prisma = this.reservationsRepository.prismaClient;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.reserva.findUnique({
        where: { reserva_id: reservaId },
        select: {
          reserva_id: true,
          estatus_reserva_code: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      const statusRecord = await tx.cat_estatus_reserva.findUnique({
        where: { estatus_reserva_code: dto.estatus_reserva_code },
        select: { estatus_reserva_code: true },
      });

      if (!statusRecord) {
        throw new BadRequestException('Invalid estatus_reserva_code');
      }

      if (existing.estatus_reserva_code !== dto.estatus_reserva_code) {
        await tx.reserva.update({
          where: { reserva_id: reservaId },
          data: { estatus_reserva_code: dto.estatus_reserva_code },
        });

        if (auditUserId !== undefined) {
          await this.reservationsRepository.createReservationHistory(tx, {
            reserva: { connect: { reserva_id: reservaId } },
            usuario: { connect: { usuario_id: auditUserId } },
            accion: 'CAMBIAR_ESTATUS',
            campo: 'estatus_reserva_code',
            valor_anterior: existing.estatus_reserva_code,
            valor_nuevo: dto.estatus_reserva_code,
          });
        }
      }
    });

    const reservation =
      await this.reservationsRepository.findReservationWithRelations(reservaId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found after status change');
    }

    return toReservationDetail(reservation);
  }

  private buildWhere(query: ReservationQueryDto): Prisma.reservaWhereInput {
    const where: Prisma.reservaWhereInput = {};
    const and: Prisma.reservaWhereInput[] = [];

    if (query.ubicacion_id) {
      where.ubicacion_id = this.parseId(query.ubicacion_id, 'ubicacion_id');
    }

    if (query.cliente_id) {
      where.cliente_id = this.parseId(query.cliente_id, 'cliente_id');
    }

    if (query.estatus_reserva_code) {
      where.estatus_reserva_code = query.estatus_reserva_code;
    }

    if (query.origen) {
      where.origen_reserva_code = query.origen;
    }

    const fromDate = query.from
      ? this.parseDate(query.from, 'from')
      : undefined;
    const toDate = query.to ? this.parseDate(query.to, 'to') : undefined;

    if (fromDate && toDate && fromDate >= toDate) {
      throw new BadRequestException('from must be earlier than to');
    }

    if (fromDate) {
      and.push({ checkout_datetime: { gt: fromDate } });
    }

    if (toDate) {
      and.push({ checkin_datetime: { lt: toDate } });
    }

    if (and.length) {
      where.AND = and;
    }

    return where;
  }

  private parseId(value: string, field: string): bigint {
    try {
      return BigInt(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid number`, {
        cause: normalizedError,
      });
    }
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }

    return date;
  }

  private parseDecimal(value: number, field: string): Prisma.Decimal {
    try {
      return new Prisma.Decimal(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid decimal value`, {
        cause: normalizedError,
      });
    }
  }
}
