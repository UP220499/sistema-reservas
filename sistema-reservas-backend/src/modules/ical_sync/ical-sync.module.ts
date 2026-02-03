import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IcalSyncController } from './ical-sync.controller';
import { IcalSyncService } from './ical-sync.service';
import { IcalSyncRepository } from './prisma/ical-sync.repository';

@Module({
  imports: [PrismaModule],
  controllers: [IcalSyncController],
  providers: [IcalSyncService, IcalSyncRepository],
})
export class IcalSyncModule {}
