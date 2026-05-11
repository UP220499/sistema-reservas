import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsGlobalController } from './payments-global.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './prisma/payments.repository';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, PaymentsGlobalController],
  providers: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
