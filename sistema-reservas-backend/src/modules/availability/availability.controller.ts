import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityResponse } from './mappers/availability.mapper';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Disponibilidad')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  check(@Query() query: AvailabilityQueryDto): Promise<AvailabilityResponse> {
    return this.availabilityService.checkAvailability(query);
  }
}
