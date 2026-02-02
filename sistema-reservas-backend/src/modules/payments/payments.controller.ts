import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('reservations/:reservation_id/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /*
    Sample payload:
    {
      "tipo_pago_mov_code": "EFECTIVO",
      "metodo_pago_code": "CASH",
      "monto": 1500,
      "fecha_pago": "2026-02-04T18:30:00.000Z",
      "referencia": "ABCD-1234",
      "notas": "Pago en mostrador"
    }
    Optional header: x-user-id: 42
  */
  @Post()
  create(
    @Param('reservation_id') reservationId: string,
    @Body() dto: CreatePaymentDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const auditUserId = userIdHeader?.trim();
    return this.paymentsService.create(
      reservationId,
      dto,
      auditUserId ? auditUserId : undefined,
    );
  }

  @Get()
  findAll(@Param('reservation_id') reservationId: string) {
    return this.paymentsService.findByReservation(reservationId);
  }
}
