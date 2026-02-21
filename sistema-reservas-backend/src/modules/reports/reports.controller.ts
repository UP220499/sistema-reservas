import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  getStats() {
    return this.reportsService.getStats();
  }

  @Get('availability/today')
  getAvailabilityToday() {
    return this.reportsService.getAvailabilityToday();
  }

  @Get('occupancy')
  getOccupancy() {
    return this.reportsService.getOccupancy();
  }

  @Get('revenue')
  getRevenue() {
    return this.reportsService.getRevenue();
  }
}
