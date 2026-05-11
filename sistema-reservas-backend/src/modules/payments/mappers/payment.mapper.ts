import { Prisma } from '@prisma/client';

export type PaymentWithReservation = Prisma.pago_movimientoGetPayload<{
  select: {
    pago_movimiento_id: true;
    reserva_id: true;
    tipo_pago_mov_code: true;
    metodo_pago_code: true;
    monto: true;
    fecha_pago: true;
    referencia: true;
    notas: true;
    created_at: true;
  };
}> & {
  reserva?: {
    ubicacion_id: bigint;
    cliente_id: bigint;
  };
};

export interface PaymentResponse {
  pago_movimiento_id: string;
  reserva_id: string;
  ubicacion_id?: string;
  cliente_id?: string;
  tipo_pago_mov_code: string;
  metodo_pago_code: string;
  monto: string;
  fecha_pago: string;
  referencia: string | null;
  notas: string | null;
  created_at: string;
}

export function toPaymentResponse(
  payment: PaymentWithReservation,
): PaymentResponse {
  return {
    pago_movimiento_id: payment.pago_movimiento_id.toString(),
    reserva_id: payment.reserva_id.toString(),
    ubicacion_id: payment.reserva?.ubicacion_id?.toString(),
    cliente_id: payment.reserva?.cliente_id?.toString(),
    tipo_pago_mov_code: payment.tipo_pago_mov_code,
    metodo_pago_code: payment.metodo_pago_code,
    monto: payment.monto.toString(),
    fecha_pago: payment.fecha_pago.toISOString(),
    referencia: payment.referencia ?? null,
    notas: payment.notas ?? null,
    created_at: payment.created_at.toISOString(),
  };
}
