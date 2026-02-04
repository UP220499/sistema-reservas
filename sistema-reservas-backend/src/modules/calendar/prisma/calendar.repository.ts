import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BlockEventRaw, ReservationEventRaw } from '../calendar.mapper';

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findReservations(params: {
    from: Date;
    to: Date;
    ubicacionId?: bigint;
  }): Promise<ReservationEventRaw[]> {
    const { from, to, ubicacionId } = params;

    return this.prisma.reserva.findMany({
      where: {
        ...(ubicacionId ? { ubicacion_id: ubicacionId } : {}),
        checkin_datetime: { lt: to },
        checkout_datetime: { gt: from },
        cat_estatus_reserva: {
          bloquea_disponibilidad: true,
        },
      },
      select: {
        reserva_id: true,
        ubicacion_id: true,
        checkin_datetime: true,
        checkout_datetime: true,
        estatus_reserva_code: true,
        origen_reserva_code: true,
        cliente: {
          select: {
            cliente_id: true,
            nombre: true,
          },
        },
        ubicacion: {
          select: {
            ubicacion_id: true,
            nombre: true,
          },
        },
      },
    });
  }

  findBlocks(params: {
    from: Date;
    to: Date;
    ubicacionId?: bigint;
  }): Promise<BlockEventRaw[]> {
    const { from, to, ubicacionId } = params;

    return this.prisma.bloqueo_calendario.findMany({
      where: {
        estatus_bloqueo: 'ACTIVO',
        ...(ubicacionId ? { ubicacion_id: ubicacionId } : {}),
        inicio_datetime: { lt: to },
        fin_datetime: { gt: from },
      },
      select: {
        bloqueo_id: true,
        ubicacion_id: true,
        inicio_datetime: true,
        fin_datetime: true,
        estatus_bloqueo: true,
        origen_bloqueo_code: true,
        external_uid: true,
        ubicacion: {
          select: {
            ubicacion_id: true,
            nombre: true,
          },
        },
      },
    });
  }
}
