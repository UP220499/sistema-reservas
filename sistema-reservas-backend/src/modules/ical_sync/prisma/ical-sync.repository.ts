import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedIcalEvent } from '../ical.parser';

export interface LocationRecord {
  ubicacion_id: bigint;
}

@Injectable()
export class IcalSyncRepository {
  private readonly logger = new Logger(IcalSyncRepository.name);

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
        // SAVEPOINT por evento para que un 23P01 no aborte toda la transacción
        const sp = `sp_airbnb_${uid.replace(/[^a-zA-Z0-9_]/g, '_')}`;

        await tx.$executeRawUnsafe(`SAVEPOINT ${sp}`);

        try {
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

            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
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

          await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const lowerMsg = msg.toLowerCase();

          const is23P01 =
            lowerMsg.includes('23p01') ||
            lowerMsg.includes('ex_ocupacion_no_traslape') ||
            lowerMsg.includes('restricción de exclusión') ||
            lowerMsg.includes('llave en conflicto') ||
            lowerMsg.includes('exclusion constraint');

          // Si falló por traslape, revertimos SOLO este evento y seguimos
          if (is23P01) {
            await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);

            this.logger.warn(
              `Skip overlapping event (23P01): ubicacion_id=${ubicacionId}, external_uid=${uid}, inicio_datetime=${event.start.toISOString()}, fin_datetime=${event.end.toISOString()}`,
            );
            continue;
          }

          // Para cualquier otro error, limpia el savepoint y re-lanza
          await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${sp}`);
          await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${sp}`);
          throw err;
        }
      }

      return {
        created,
        reactivated,
        deactivated: deactivatedResult.count,
      };
    });
  }
}
