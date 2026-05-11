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
    pago_movimiento: {
      select: {
        monto: true;
        tipo_pago_mov_code: true;
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
  estatus_pago: string;
  saldo_pendiente: string | null;
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

const INCOME_PAYMENT_TYPES = new Set(['ANTICIPO', 'LIQUIDACION']);

export function toReservationSummary(
  reservation: ReservationWithRelations,
): ReservationSummary {
  const totalReserva = reservation.total_reserva ?? new Prisma.Decimal(0);

  // Sum only the income payment types to determine how much was paid
  const totalPagado = reservation.pago_movimiento
    .filter((p) => INCOME_PAYMENT_TYPES.has(p.tipo_pago_mov_code))
    .reduce((acc, p) => acc.add(p.monto), new Prisma.Decimal(0));

  const saldoPendiente = totalReserva.minus(totalPagado);

  let estatus_pago = 'PENDIENTE';
  if (reservation.total_reserva) {
    if (saldoPendiente.lte(0)) {
      estatus_pago = 'LIQUIDADO';
    } else if (totalPagado.gt(0)) {
      estatus_pago = 'PARCIAL';
    }
  } else {
    // If there is no total_reserva defined, we can't reliably say it's paid off,
    // but if they paid something, we can at least say PARCIAL.
    if (totalPagado.gt(0)) {
      estatus_pago = 'PARCIAL';
    }
  }

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
    total_reserva: reservation.total_reserva ? reservation.total_reserva.toString() : null,
    estatus_pago,
    saldo_pendiente: reservation.total_reserva ? saldoPendiente.toString() : null,
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
