import { Prisma } from '@prisma/client';

export type ReservationHistoryWithUser =
  Prisma.historial_reserva_eventoGetPayload<{
    include: {
      usuario: {
        select: {
          usuario_id: true;
          nombre: true;
          username: true;
        };
      };
    };
  }>;

export interface ReservationHistoryEntry {
  historial_evento_id: string;
  reserva_id: string;
  usuario_id: string;
  accion: string;
  campo: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  fecha_evento: string;
  usuario: {
    usuario_id: string;
    nombre: string;
    username: string;
  };
}

export function toReservationHistoryEntry(
  history: ReservationHistoryWithUser,
): ReservationHistoryEntry {
  return {
    historial_evento_id: history.historial_evento_id.toString(),
    reserva_id: history.reserva_id.toString(),
    usuario_id: history.usuario_id.toString(),
    accion: history.accion,
    campo: history.campo ?? null,
    valor_anterior: history.valor_anterior ?? null,
    valor_nuevo: history.valor_nuevo ?? null,
    fecha_evento: history.fecha_evento.toISOString(),
    usuario: {
      usuario_id: history.usuario.usuario_id.toString(),
      nombre: history.usuario.nombre,
      username: history.usuario.username,
    },
  };
}
