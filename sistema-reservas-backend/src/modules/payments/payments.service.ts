import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsRepository } from './prisma/payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponse, toPaymentResponse } from './mappers/payment.mapper';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async create(
    reservationId: string,
    dto: CreatePaymentDto,
    auditUserId?: bigint,
  ): Promise<PaymentResponse> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    const reservaId = this.parseId(reservationId, 'reservation_id');

    await this.paymentsRepository.assertReservationExists(reservaId);

    const fechaPago = this.parseDate(dto.fecha_pago, 'fecha_pago');
    const montoDecimal = this.parseDecimal(dto.monto, 'monto');

    if (montoDecimal.lte(new Prisma.Decimal(0))) {
      throw new BadRequestException('monto debe ser mayor a 0');
    }

    const created = await this.paymentsRepository.createPayment({
      reserva: { connect: { reserva_id: reservaId } },
      cat_tipo_pago_mov: {
        connect: { tipo_pago_mov_code: dto.tipo_pago_mov_code },
      },
      cat_metodo_pago: {
        connect: { metodo_pago_code: dto.metodo_pago_code },
      },
      monto: montoDecimal,
      fecha_pago: fechaPago,
      referencia: dto.referencia ?? null,
      notas: dto.notas ?? null,
      usuario: { connect: { usuario_id: auditUserId } },
    });

    return toPaymentResponse(created);
  }

  async findByReservation(reservationId: string): Promise<PaymentResponse[]> {
    const reservaId = this.parseId(reservationId, 'reservation_id');

    await this.paymentsRepository.assertReservationExists(reservaId);

    const payments =
      await this.paymentsRepository.findPaymentsByReservation(reservaId);

    return payments.map((payment) => toPaymentResponse(payment));
  }

  private parseId(value: string, field: string): bigint {
    try {
      return BigInt(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid number`, {
        cause: normalizedError,
      });
    }
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }

    return date;
  }

  private parseDecimal(value: number, field: string): Prisma.Decimal {
    try {
      return new Prisma.Decimal(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid decimal`, {
        cause: normalizedError,
      });
    }
  }
}
