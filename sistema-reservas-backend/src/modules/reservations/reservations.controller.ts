import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Sample request: GET /reservations?page=1&page_size=10&ubicacion_id=5&from=2026-02-01T00:00:00.000Z
  @Get()
  findAll(@Query() query: ReservationQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(':reservation_id')
  findOne(@Param('reservation_id') reservationId: string) {
    return this.reservationsService.findOne(reservationId);
  }

  /*
    Sample payload:
    {
      "cliente_id": "1",
      "ubicacion_id": "2",
      "origen_reserva_code": "EXTERNA",
      "checkin_datetime": "2026-02-10T15:00:00.000Z",
      "checkout_datetime": "2026-02-12T11:00:00.000Z",
      "estatus_reserva_code": "CONFIRMADA",
      "total_reserva": 1200,
      "notas": "Cliente frecuente"
    }
    Optional header: x-user-id: 42
  */
  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    return this.reservationsService.create(dto, userIdHeader ?? undefined);
  }
}
