import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentWithReservation } from '../mappers/payment.mapper';

/** Payment types that represent real income for balance calculations. */
const INCOME_PAYMENT_TYPES = ['ANTICIPO', 'LIQUIDACION'] as const;

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async assertReservationExists(reserva_id: bigint): Promise<void> {
    const exists = await this.prisma.reserva.findUnique({
      where: { reserva_id },
      select: { reserva_id: true },
    });

    if (!exists) {
      throw new NotFoundException('Reservation not found');
    }
  }

  /**
   * Creates a payment inside a single REPEATABLE READ transaction that:
   *   1. Fetches the reservation (404 if not found).
   *   2. Aggregates existing income payments for the reservation.
   *   3. Rejects with 400 if the new amount would exceed total_reserva.
   *   4. Inserts the pago_movimiento row.
   *
   * REPEATABLE READ ensures both the aggregate read and the write see a
   * consistent snapshot, preventing most concurrent double-spend scenarios.
   */
  async createPaymentChecked(
    reservaId: bigint,
    data: Prisma.pago_movimientoCreateInput,
    monto: Prisma.Decimal,
  ): Promise<PaymentWithReservation> {
    return this.prisma.$transaction(
      async (tx) => {
        // ── 1. Fetch reservation ────────────────────────────────────────────
        const reserva = await tx.reserva.findUnique({
          where: { reserva_id: reservaId },
          select: { reserva_id: true, total_reserva: true },
        });

        if (!reserva) {
          throw new NotFoundException('Reservation not found');
        }

        // ── 2. Sum existing income payments ─────────────────────────────────
        const paidAgg = await tx.pago_movimiento.aggregate({
          where: {
            reserva_id: reservaId,
            tipo_pago_mov_code: { in: [...INCOME_PAYMENT_TYPES] },
            monto: { gt: 0 },
          },
          _sum: { monto: true },
        });

        const total = reserva.total_reserva ?? new Prisma.Decimal(0);
        const paid = paidAgg._sum.monto ?? new Prisma.Decimal(0);
        const remaining = total.minus(paid);

        // ── 3. Balance check ────────────────────────────────────────────────
        if (monto.gt(remaining)) {
          throw new BadRequestException({
            message: 'Payment exceeds remaining balance',
            remaining: remaining.toString(),
            total: total.toString(),
            paid: paid.toString(),
          });
        }

        // ── 4. Insert payment ───────────────────────────────────────────────
        return tx.pago_movimiento.create({
          data,
          select: {
            pago_movimiento_id: true,
            reserva_id: true,
            tipo_pago_mov_code: true,
            metodo_pago_code: true,
            monto: true,
            fecha_pago: true,
            referencia: true,
            notas: true,
            created_at: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async createPayment(
    data: Prisma.pago_movimientoCreateInput,
  ): Promise<PaymentWithReservation> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.pago_movimiento.create({
        data,
        select: {
          pago_movimiento_id: true,
          reserva_id: true,
          tipo_pago_mov_code: true,
          metodo_pago_code: true,
          monto: true,
          fecha_pago: true,
          referencia: true,
          notas: true,
          created_at: true,
        },
      });

      return created;
    });
  }

  async findPaymentsByReservation(
    reserva_id: bigint,
  ): Promise<PaymentWithReservation[]> {
    return this.prisma.pago_movimiento.findMany({
      where: { reserva_id },
      orderBy: { fecha_pago: 'asc' },
      select: {
        pago_movimiento_id: true,
        reserva_id: true,
        tipo_pago_mov_code: true,
        metodo_pago_code: true,
        monto: true,
        fecha_pago: true,
        referencia: true,
        notas: true,
        created_at: true,
      },
    });
  }
}

/*
Manual testing — POST /reservations/:id/payments
Header requerido: x-user-id: <id_usuario_válido>

Case 1 — OK: remaining suficiente
  Prerequisito: reserva con total_reserva=5000 y pagos ANTICIPO existentes=2000.
  body: { "tipo_pago_mov_code":"LIQUIDACION", "metodo_pago_code":"EFECTIVO",
          "monto":1500, "fecha_pago":"2026-02-24T12:00:00Z" }
  Expected → HTTP 201 con el pago creado; saldo restante después = 1500.

Case 2 — FAIL: excede saldo restante
  Prerequisito: reserva con total_reserva=5000 y pagos existentes=4500.
  body: { "tipo_pago_mov_code":"ANTICIPO", "metodo_pago_code":"EFECTIVO",
          "monto":1000, "fecha_pago":"2026-02-24T12:00:00Z" }
  Expected → HTTP 400:
  {
    "message": "Payment exceeds remaining balance",
    "remaining": "500",
    "total": "5000",
    "paid": "4500"
  }

Case 3 — FAIL: monto negativo o cero
  body: { ..., "monto": -100 }  o  { ..., "monto": 0 }
  Expected → HTTP 400 (interceptado por DTO @Min(0.01)):
  { "message": ["monto debe ser mayor a 0"], "error": "Bad Request", "statusCode": 400 }
*/
