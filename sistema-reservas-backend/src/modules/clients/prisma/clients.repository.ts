import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { LOYALTY_COMPLETED_STATUSES } from '../loyalty/loyalty';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyPaged(where: Prisma.clienteWhereInput, skip: number, take: number) {
    return this.prisma.cliente.findMany({
      where,
      skip,
      take,
      orderBy: { cliente_id: 'asc' },
      include: {
        cliente_telefono: {
          where: { activo: true, es_principal: true },
          take: 1,
        },
      },
    });
  }

  count(where: Prisma.clienteWhereInput) {
    return this.prisma.cliente.count({ where });
  }

  findById(cliente_id: bigint) {
    return this.prisma.cliente.findUnique({
      where: { cliente_id },
      include: {
        cliente_telefono: {
          where: { activo: true },
          orderBy: { es_principal: 'desc' },
        },
      },
    });
  }

  createClient(data: Prisma.clienteCreateInput) {
    return this.prisma.cliente.create({ data });
  }

  updateClient(cliente_id: bigint, data: Prisma.clienteUpdateInput) {
    return this.prisma.cliente.update({ where: { cliente_id }, data });
  }

  setClientActive(cliente_id: bigint, activo: boolean) {
    return this.prisma.cliente.update({
      where: { cliente_id },
      data: { activo },
    });
  }

  addPhone(
    cliente_id: bigint,
    data: Omit<Prisma.cliente_telefonoCreateInput, 'cliente'>,
  ) {
    return this.prisma.cliente_telefono.create({
      data: {
        ...data,
        cliente: { connect: { cliente_id } },
      },
    });
  }

  updatePhone(
    cliente_telefono_id: bigint,
    data: Prisma.cliente_telefonoUpdateInput,
  ) {
    return this.prisma.cliente_telefono.update({
      where: { cliente_telefono_id },
      data,
    });
  }

  findActivePhones(cliente_id: bigint) {
    return this.prisma.cliente_telefono.findMany({
      where: { cliente_id, activo: true },
      orderBy: { es_principal: 'desc' },
    });
  }

  findPrimaryPhone(cliente_id: bigint) {
    return this.prisma.cliente_telefono.findFirst({
      where: { cliente_id, activo: true, es_principal: true },
    });
  }

  /**
   * Returns a Map<cliente_id, { count, monto }> for bulk loyalty calculation.
   * Uses a single groupBy (+ _count + _sum) to avoid N+1.
   * Clients with no matching reservations are absent from the map.
   */
  async getLoyaltySums(
    clienteIds: bigint[],
  ): Promise<Map<bigint, { count: number; monto: Prisma.Decimal }>> {
    if (!clienteIds.length) {
      return new Map();
    }

    const groups = await this.prisma.reserva.groupBy({
      by: ['cliente_id'],
      where: {
        cliente_id: { in: clienteIds },
        estatus_reserva_code: { in: [...LOYALTY_COMPLETED_STATUSES] },
        total_reserva: { not: null },
      },
      _count: { _all: true },
      _sum: { total_reserva: true },
    });

    const map = new Map<bigint, { count: number; monto: Prisma.Decimal }>();
    for (const g of groups) {
      map.set(g.cliente_id, {
        count: g._count._all,
        monto: g._sum.total_reserva ?? new Prisma.Decimal(0),
      });
    }
    return map;
  }

  /**
   * Returns loyalty { count, monto } for a single client.
   * Runs count + aggregate in parallel; intended for detail endpoints.
   */
  async getLoyaltySum(
    clienteId: bigint,
  ): Promise<{ count: number; monto: Prisma.Decimal }> {
    const loyaltyWhere: Prisma.reservaWhereInput = {
      cliente_id: clienteId,
      estatus_reserva_code: { in: [...LOYALTY_COMPLETED_STATUSES] },
    };

    const [count, agg] = await Promise.all([
      this.prisma.reserva.count({ where: loyaltyWhere }),
      this.prisma.reserva.aggregate({
        where: { ...loyaltyWhere, total_reserva: { not: null } },
        _sum: { total_reserva: true },
      }),
    ]);

    return { count, monto: agg._sum.total_reserva ?? new Prisma.Decimal(0) };
  }

  get prismaClient() {
    return this.prisma;
  }
}
