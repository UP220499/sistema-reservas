import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { IcalSyncModule } from './modules/ical_sync/ical-sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ClientsModule,
    ReservationsModule,
    PaymentsModule,
    BlocksModule,
    AvailabilityModule,
    IcalSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
