import { Controller, Post, Query } from '@nestjs/common';
import { IcalSyncService } from './ical-sync.service';
import { IcalSyncQueryDto } from './dto/ical-sync-query.dto';

@Controller('ical')
export class IcalSyncController {
  constructor(private readonly icalSyncService: IcalSyncService) {}

  @Post('sync')
  sync(@Query() query: IcalSyncQueryDto): Promise<{
    ubicacion_id: string;
    events_total: number;
    upserted: number;
    deactivated: number;
  }> {
    return this.icalSyncService.syncAirbnbCalendar(query);
  }
}
