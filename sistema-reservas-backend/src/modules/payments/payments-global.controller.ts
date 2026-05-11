import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsGlobalController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':payment_id/pdf')
  async getPaymentPdf(
    @Param('payment_id') paymentId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.paymentsService.generateReceipt(paymentId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=recibo-${paymentId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
