import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsRepository } from './prisma/payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentResponse, toPaymentResponse } from './mappers/payment.mapper';
import { PdfService } from './pdf.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly pdfService: PdfService,
  ) {}

  async create(
    reservationId: string,
    dto: CreatePaymentDto,
    auditUserId?: bigint,
  ): Promise<PaymentResponse> {
    if (auditUserId === undefined) {
      throw new BadRequestException('Audit user is required');
    }

    if (dto.tipo_pago_mov_code === 'AJUSTE') {
      throw new BadRequestException('tipo_pago_mov_code AJUSTE is not allowed');
    }

    const reservaId = this.parseId(reservationId, 'reservation_id');

    const fechaPago = this.parseDate(dto.fecha_pago, 'fecha_pago');
    const montoDecimal = this.parseDecimal(dto.monto, 'monto');

    if (montoDecimal.lte(new Prisma.Decimal(0))) {
      throw new BadRequestException('monto debe ser mayor a 0');
    }

    // Reservation existence, balance validation, and insert are executed
    // atomically inside createPaymentChecked (REPEATABLE READ transaction).
    const created = await this.paymentsRepository.createPaymentChecked(
      reservaId,
      {
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
      },
      montoDecimal,
    );

    return toPaymentResponse(created);
  }

  async findByReservation(reservationId: string): Promise<PaymentResponse[]> {
    const reservaId = this.parseId(reservationId, 'reservation_id');

    await this.paymentsRepository.assertReservationExists(reservaId);

    const payments =
      await this.paymentsRepository.findPaymentsByReservation(reservaId);

    return payments.map((payment) => toPaymentResponse(payment));
  }

  async findAll(query: PaymentQueryDto): Promise<{
    items: PaymentResponse[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const { page, page_size, ...filters } = query;
    const skip = (page - 1) * page_size;
    const take = page_size;

    const where: Prisma.pago_movimientoWhereInput = {};

    if (filters.tipo_pago_mov_code) {
      where.tipo_pago_mov_code = filters.tipo_pago_mov_code;
    }
    if (filters.metodo_pago_code) {
      where.metodo_pago_code = filters.metodo_pago_code;
    }

    if (filters.ubicacion_id || filters.cliente_id) {
      where.reserva = {};
      if (filters.ubicacion_id) {
        where.reserva.ubicacion_id = BigInt(filters.ubicacion_id);
      }
      if (filters.cliente_id) {
        where.reserva.cliente_id = BigInt(filters.cliente_id);
      }
    }

    if (filters.from || filters.to) {
      where.fecha_pago = {};
      if (filters.from) {
        where.fecha_pago.gte = this.parseDate(filters.from, 'from');
      }
      if (filters.to) {
        where.fecha_pago.lte = this.parseDate(filters.to, 'to');
      }
    }

    const [total, items] = await Promise.all([
      this.paymentsRepository.count(where),
      this.paymentsRepository.findManyPaged(skip, take, where),
    ]);

    const itemsList = items.map((payment) => toPaymentResponse(payment));
    const total_pages = Math.ceil(total / page_size);

    return {
      items: itemsList,
      total,
      page,
      page_size,
      total_pages,
    };
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

  async generateReceipt(paymentId: string): Promise<Buffer> {
    const parsedId = this.parseId(paymentId, 'payment_id');
    const payment = await this.paymentsRepository.findByIdWithNames(parsedId);

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const folio = `PAG-${payment.pago_movimiento_id.toString().padStart(6, '0')}`;

    return this.pdfService.generatePaymentReceipt({
      folio,
      date: payment.fecha_pago.toISOString().split('T')[0], // YYYY-MM-DD
      type: payment.tipo_pago_mov_code,
      method: payment.metodo_pago_code,
      amount: Number(payment.monto),
      reference: payment.referencia ?? 'N/A',
      notes: payment.notas ?? '',
      clientName: payment.reserva.cliente.nombre,
      locationName: payment.reserva.ubicacion.nombre,
    });
  }
}
