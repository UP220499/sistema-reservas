import { Controller, Post, Query } from '@nestjs/common';
import { IcalSyncService } from './ical-sync.service';
import { IcalSyncQueryDto } from './dto/ical-sync-query.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireUser } from '../../common/decorators/require-user.decorator';

@ApiTags('iCal Sync')
@Controller('ical')
export class IcalSyncController {
  constructor(private readonly icalSyncService: IcalSyncService) {}

  @Post('sync')
  @RequireUser()
  @Roles('ADMIN')
  sync(@Query() query: IcalSyncQueryDto): Promise<{
    ubicacion_id: string;
    events_total: number;
    upserted: number;
    deactivated: number;
  }> {
    return this.icalSyncService.syncAirbnbCalendar(query);
  }
}
