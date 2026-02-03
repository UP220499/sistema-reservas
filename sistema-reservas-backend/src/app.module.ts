import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BlocksModule } from './modules/blocks/blocks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClientsModule,
    ReservationsModule,
    PaymentsModule,
    BlocksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}