import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentWithReservation } from '../mappers/payment.mapper';

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
