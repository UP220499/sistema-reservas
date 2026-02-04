import { Controller, Get, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Ejemplo: GET /calendar?from=2026-02-01T00:00:00.000Z&to=2026-02-10T00:00:00.000Z
  // Ejemplo: GET /calendar?from=2026-02-01T00:00:00.000Z&to=2026-02-02T00:00:00.000Z&include=reservas&page=2
  @Get()
  findAll(@Query() query: CalendarQueryDto) {
    return this.calendarService.findAll(query);
  }
}
