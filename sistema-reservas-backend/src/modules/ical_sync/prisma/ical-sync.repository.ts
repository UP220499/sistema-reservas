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
  ): Promise<{ created: number; reactivated: number; deactivated: number }> {
    const updatedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const eventsByUid = new Map<string, ParsedIcalEvent>();

      for (const event of events) {
        const trimmedUid = event.uid?.trim();
        if (!trimmedUid) {
          continue;
        }

        if (!eventsByUid.has(trimmedUid)) {
          eventsByUid.set(trimmedUid, { ...event, uid: trimmedUid });
        }
      }

      const deactivatedResult: Prisma.BatchPayload =
        await tx.bloqueo_calendario.updateMany({
          where: {
            ubicacion_id: ubicacionId,
            origen_bloqueo_code: 'AIRBNB',
            estatus_bloqueo: 'ACTIVO',
          },
          data: {
            estatus_bloqueo: 'INACTIVO',
            updated_at: updatedAt,
          },
        });

      let created = 0;
      let reactivated = 0;

      for (const [uid, event] of eventsByUid.entries()) {
        const updateResult: Prisma.BatchPayload =
          await tx.bloqueo_calendario.updateMany({
            where: {
              ubicacion_id: ubicacionId,
              origen_bloqueo_code: 'AIRBNB',
              external_uid: uid,
            },
            data: {
              inicio_datetime: event.start,
              fin_datetime: event.end,
              estatus_bloqueo: 'ACTIVO',
              raw_payload: event.raw,
              updated_at: updatedAt,
            },
          });

        if (updateResult.count > 0) {
          reactivated += updateResult.count;
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
            external_uid: uid,
            raw_payload: event.raw,
            updated_at: updatedAt,
          },
        });
        created += 1;
      }

      return {
        created,
        reactivated,
        deactivated: deactivatedResult.count,
      };
    });
  }
}
