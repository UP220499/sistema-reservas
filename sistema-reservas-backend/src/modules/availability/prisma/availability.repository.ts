import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ReservationConflictRecord {
  reserva_id: bigint;
  checkin_datetime: Date;
  checkout_datetime: Date;
  estatus_reserva_code: string;
  origen_reserva_code: string;
}

export interface BlockConflictRecord {
  bloqueo_id: bigint;
  inicio_datetime: Date;
  fin_datetime: Date;
  estatus_bloqueo: string;
  origen_bloqueo_code: string;
}

export interface LocationMinimal {
  ubicacion_id: bigint;
}

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLocationById(ubicacion_id: bigint): Promise<LocationMinimal | null> {
    return this.prisma.ubicacion.findUnique({
      where: { ubicacion_id },
      select: { ubicacion_id: true },
    });
  }

  getReservationConflicts(
    ubicacion_id: bigint,
    from: Date,
    to: Date,
  ): Promise<ReservationConflictRecord[]> {
    return this.prisma.reserva.findMany({
      where: {
        ubicacion_id,
        checkin_datetime: { lt: to },
        checkout_datetime: { gt: from },
        cat_estatus_reserva: { bloquea_disponibilidad: true },
      },
      select: {
        reserva_id: true,
        checkin_datetime: true,
        checkout_datetime: true,
        estatus_reserva_code: true,
        origen_reserva_code: true,
      },
      orderBy: { checkin_datetime: 'asc' },
    });
  }

  getBlockConflicts(
    ubicacion_id: bigint,
    from: Date,
    to: Date,
  ): Promise<BlockConflictRecord[]> {
    return this.prisma.bloqueo_calendario.findMany({
      where: {
        ubicacion_id,
        estatus_bloqueo: 'ACTIVO',
        inicio_datetime: { lt: to },
        fin_datetime: { gt: from },
      },
      select: {
        bloqueo_id: true,
        inicio_datetime: true,
        fin_datetime: true,
        estatus_bloqueo: true,
        origen_bloqueo_code: true,
      },
      orderBy: { inicio_datetime: 'asc' },
    });
  }
}
