import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsGlobalController } from './payments-global.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './prisma/payments.repository';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, PaymentsGlobalController],
  providers: [PaymentsService, PaymentsRepository, PdfService],
})
export class PaymentsModule {}
