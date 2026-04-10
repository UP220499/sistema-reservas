import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { RolesGuard } from './common/guards/roles.guard';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AuthModule } from './modules/auth/auth.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { UbicacionesModule } from './modules/ubicaciones/ubicaciones.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const devMode =
          process.env.NODE_ENV !== 'production' ||
          process.env.THROTTLE_DISABLED === 'true';
        // DEV: effectively unlimited (10 000 req / 60 s)
        // PROD: 10 req / 60 s
        return devMode
          ? [{ ttl: 60_000, limit: 10_000 }]
          : [{ ttl: 60_000, limit: 10 }];
      },
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ReservationsModule,
    PaymentsModule,
    BlocksModule,
    AvailabilityModule,
    IcalSyncModule,
    CalendarModule,
    UbicacionesModule,
    ReportsModule,
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
