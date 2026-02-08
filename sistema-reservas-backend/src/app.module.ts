import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
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
import { UserIdentityGuard } from './common/guards/user-identity.guard';
import { CalendarModule } from './modules/calendar/calendar.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

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
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserIdentityGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
