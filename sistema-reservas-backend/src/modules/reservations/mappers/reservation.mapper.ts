import { Prisma } from '@prisma/client';

export type ReservationWithRelations = Prisma.reservaGetPayload<{
  include: {
    cliente: {
      select: {
        cliente_id: true;
        nombre: true;
        correo: true;
      };
    };
    ubicacion: {
      select: {
        ubicacion_id: true;
        nombre: true;
      };
    };
  };
}>;

export interface ReservationSummary {
  reserva_id: string;
  cliente_id: string;
  cliente_nombre: string;
  ubicacion_id: string;
  ubicacion_nombre: string;
  checkin_datetime: string;
  checkout_datetime: string;
  estatus_reserva_code: string;
  origen_reserva_code: string;
  total_reserva: string | null;
  notas: string | null;
  created_at: string;
}

export interface ReservationDetail extends ReservationSummary {
  cliente: {
    cliente_id: string;
    nombre: string;
    correo: string | null;
  };
  ubicacion: {
    ubicacion_id: string;
    nombre: string;
  };
}

export function toReservationSummary(
  reservation: ReservationWithRelations,
): ReservationSummary {
  const totalReserva = reservation.total_reserva
    ? reservation.total_reserva.toString()
    : null;

  return {
    reserva_id: reservation.reserva_id.toString(),
    cliente_id: reservation.cliente_id.toString(),
    cliente_nombre: reservation.cliente.nombre,
    ubicacion_id: reservation.ubicacion_id.toString(),
    ubicacion_nombre: reservation.ubicacion.nombre,
    checkin_datetime: reservation.checkin_datetime.toISOString(),
    checkout_datetime: reservation.checkout_datetime.toISOString(),
    estatus_reserva_code: reservation.estatus_reserva_code,
    origen_reserva_code: reservation.origen_reserva_code,
    total_reserva: totalReserva,
    notas: reservation.notas ?? null,
    created_at: reservation.created_at.toISOString(),
  };
}

export function toReservationDetail(
  reservation: ReservationWithRelations,
): ReservationDetail {
  const summary = toReservationSummary(reservation);

  return {
    ...summary,
    cliente: {
      cliente_id: reservation.cliente.cliente_id.toString(),
      nombre: reservation.cliente.nombre,
      correo: reservation.cliente.correo ?? null,
    },
    ubicacion: {
      ubicacion_id: reservation.ubicacion.ubicacion_id.toString(),
      nombre: reservation.ubicacion.nombre,
    },
  };
}
