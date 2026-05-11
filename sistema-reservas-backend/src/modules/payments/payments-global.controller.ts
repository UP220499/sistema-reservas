import { Controller, Get, Query } from '@nestjs/common';
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
}
