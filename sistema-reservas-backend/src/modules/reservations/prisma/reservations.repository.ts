import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReservationWithRelations } from '../mappers/reservation.mapper';
import { HistoryAction, isHistoryAction } from '../constants/history-actions';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

const reservationInclude = {
  cliente: {
    select: {
      cliente_id: true,
      nombre: true,
      correo: true,
    },
  },
  ubicacion: {
    select: {
      ubicacion_id: true,
      nombre: true,
    },
  },
} as const;

const historyInclude = {
  usuario: {
    select: {
      usuario_id: true,
      nombre: true,
      username: true,
    },
  },
} as const;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyPaged(where: Prisma.reservaWhereInput, skip: number, take: number) {
    return this.prisma.reserva.findMany({
      where,
      skip,
      take,
      orderBy: { checkin_datetime: 'asc' },
      include: reservationInclude,
    });
  }

  count(where: Prisma.reservaWhereInput) {
    return this.prisma.reserva.count({ where });
  }

  findById(reserva_id: bigint) {
    return this.findReservationWithRelations(reserva_id);
  }

  findByIdForUpdate(prismaClient: PrismaClientOrTx, reserva_id: bigint) {
    return prismaClient.reserva.findUnique({
      where: { reserva_id },
      select: {
        reserva_id: true,
        cliente_id: true,
        ubicacion_id: true,
        checkin_datetime: true,
        checkout_datetime: true,
        estatus_reserva_code: true,
        origen_reserva_code: true,
        notas: true,
        total_reserva: true,
      },
    });
  }

  findActiveClient(prismaClient: PrismaClientOrTx, cliente_id: bigint) {
    return prismaClient.cliente.findUnique({
      where: { cliente_id },
      select: {
        cliente_id: true,
        nombre: true,
        activo: true,
      },
    });
  }

  findActiveLocation(prismaClient: PrismaClientOrTx, ubicacion_id: bigint) {
    return prismaClient.ubicacion.findUnique({
      where: { ubicacion_id },
      select: {
        ubicacion_id: true,
        nombre: true,
        activa: true,
      },
    });
  }

  findOverlappingReservation(
    prismaClient: PrismaClientOrTx,
    params: {
      ubicacionId: bigint;
      checkin: Date;
      checkout: Date;
      excludeReservationId?: bigint;
    },
  ) {
    const { ubicacionId, checkin, checkout, excludeReservationId } = params;

    const where: Prisma.reservaWhereInput = {
      ubicacion_id: ubicacionId,
      checkin_datetime: { lt: checkout },
      checkout_datetime: { gt: checkin },
      cat_estatus_reserva: {
        bloquea_disponibilidad: true,
      },
      ...(excludeReservationId
        ? { reserva_id: { not: excludeReservationId } }
        : {}),
    };

    return prismaClient.reserva.findFirst({
      where,
      select: { reserva_id: true },
    });
  }

  createReservation(
    prismaClient: Prisma.TransactionClient,
    data: Prisma.reservaUncheckedCreateInput,
  ) {
    return prismaClient.reserva.create({ data });
  }

  createReservationHistory(
    prismaClient: Prisma.TransactionClient,
    data: Omit<Prisma.historial_reserva_eventoCreateInput, 'accion'> & {
      accion: HistoryAction;
    },
  ) {
    if (!isHistoryAction(data.accion)) {
      throw new InternalServerErrorException(
        `Unsupported history action: ${String(data.accion)}`,
      );
    }

    return prismaClient.historial_reserva_evento.create({ data });
  }

  updateReservation(
    prismaClient: Prisma.TransactionClient,
    reserva_id: bigint,
    data: Prisma.reservaUpdateInput,
  ) {
    return prismaClient.reserva.update({ where: { reserva_id }, data });
  }

  findReservationWithRelations(reserva_id: bigint) {
    return this.prisma.reserva.findUnique({
      where: { reserva_id },
      include: reservationInclude,
    }) as Promise<ReservationWithRelations | null>;
  }

  async reservationExists(reserva_id: bigint): Promise<boolean> {
    const found = await this.prisma.reserva.findUnique({
      where: { reserva_id },
      select: { reserva_id: true },
    });

    return found !== null;
  }

  findReservationHistory(reserva_id: bigint, skip: number, take: number) {
    return this.prisma.historial_reserva_evento.findMany({
      where: { reserva_id },
      include: historyInclude,
      orderBy: [{ fecha_evento: 'desc' }, { historial_evento_id: 'desc' }],
      skip,
      take,
    });
  }

  countReservationHistory(reserva_id: bigint) {
    return this.prisma.historial_reserva_evento.count({
      where: { reserva_id },
    });
  }

  get prismaClient() {
    return this.prisma;
  }
}
