import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedIcalEvent } from '../ical.parser';

export interface LocationRecord {
  ubicacion_id: bigint;
}

@Injectable()
export class IcalSyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLocation(ubicacionId: bigint): Promise<LocationRecord | null> {
    return this.prisma.ubicacion.findUnique({
      where: { ubicacion_id: ubicacionId },
      select: { ubicacion_id: true },
    });
  }

  findActiveLocations(): Promise<LocationRecord[]> {
    return this.prisma.ubicacion.findMany({
      where: { activa: true },
      select: { ubicacion_id: true },
      orderBy: { ubicacion_id: 'asc' },
    });
  }

  async upsertAirbnbBlocks(
    ubicacionId: bigint,
    events: ParsedIcalEvent[],
  ): Promise<number> {
    if (events.length === 0) {
      return 0;
    }

    const updatedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      let affected = 0;

      const eventsByUid = new Map<string, ParsedIcalEvent>();

      for (const event of events) {
        const updateResult = await tx.bloqueo_calendario.updateMany({
          where: {
            ubicacion_id: ubicacionId,
            origen_bloqueo_code: 'AIRBNB',
            external_uid: event.uid,
          },
          data: {
            inicio_datetime: event.start,
            fin_datetime: event.end,
            estatus_bloqueo: 'ACTIVO',
            raw_payload: event.raw,
            updated_at: updatedAt,
          },
        });

        if (updated.count > 0) {
          affected += 1;
          continue;
        }

        await tx.bloqueo_calendario.create({
          data: {
            ubicacion: { connect: { ubicacion_id: ubicacionId } },
            cat_origen_bloqueo: {
              connect: { origen_bloqueo_code: 'AIRBNB' },
            },
            inicio_datetime: event.start,
            fin_datetime: event.end,
            estatus_bloqueo: 'ACTIVO',
            external_uid: event.uid,
            raw_payload: event.raw,
          },
        });
        affected += 1;
      }

      return affected;
    });
  }

  async deactivateMissingAirbnbBlocks(
    ubicacionId: bigint,
    uids: string[],
  ): Promise<number> {
    const where: Prisma.bloqueo_calendarioWhereInput = {
      ubicacion_id: ubicacionId,
      origen_bloqueo_code: 'AIRBNB',
      estatus_bloqueo: 'ACTIVO',
    };

    if (uids.length > 0) {
      where.external_uid = { notIn: uids };
    }

    const result = await this.prisma.bloqueo_calendario.updateMany({
      where,
      data: {
        estatus_bloqueo: 'INACTIVO',
        updated_at: new Date(),
      },
    });

    return result.count;
  }
}
