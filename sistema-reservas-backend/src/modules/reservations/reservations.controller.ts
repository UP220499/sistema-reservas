import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ReservationsService } from './reservations.service';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationTimesDto } from './dto/update-reservation-times.dto';
import { ChangeReservationStatusDto } from './dto/change-reservation-status.dto';
import { ReservationHistoryQueryDto } from './dto/reservation-history-query.dto';
import { RequireUser } from '../../common/decorators/require-user.decorator';
import { AuditUserId } from '../../common/decorators/audit-user.decorator';

@ApiTags('Reservas')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Sample request: GET /reservations?page=1&page_size=10&ubicacion_id=5&from=2026-02-01T00:00:00.000Z
  @Get()
  findAll(@Query() query: ReservationQueryDto) {
    return this.reservationsService.findAll(query);
  }

  @Get('reminders/pending-balances')
  getPendingBalancesReminders(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 3;
    return this.reservationsService.getPendingBalancesReminders(
      isNaN(daysNumber) ? 3 : daysNumber,
    );
  }

  @Get(':reservation_id')
  findOne(@Param('reservation_id') reservationId: string) {
    return this.reservationsService.findOne(reservationId);
  }

  @Get(':reservation_id/history')
  findHistory(
    @Param('reservation_id') reservationId: string,
    @Query() query: ReservationHistoryQueryDto,
  ) {
    return this.reservationsService.findHistory(reservationId, query);
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
    Required header: x-user-id: 42
  */
  @Post()
  @RequireUser()
  create(
    @Body() dto: CreateReservationDto,
    @AuditUserId() auditUserId?: bigint,
  ) {
    return this.reservationsService.create(dto, auditUserId);
  }

  /*
    Sample payload:
    {
      "checkin_datetime": "2026-02-15T15:00:00.000Z",
      "checkout_datetime": "2026-02-18T11:00:00.000Z",
      "estatus_reserva_code": "CONFIRMADA",
      "notas": "Cliente solicitó cambio"
    }
    Required header: x-user-id: 42
  */
  @Put(':reservation_id')
  @RequireUser()
  update(
    @Param('reservation_id') reservationId: string,
    @Body() dto: UpdateReservationDto,
    @AuditUserId() auditUserId?: bigint,
  ) {
    return this.reservationsService.update(reservationId, dto, auditUserId);
  }

  /*
    Sample payload:
    {
      "checkin_datetime": "2026-02-10T15:00:00.000Z",
      "checkout_datetime": "2026-02-12T11:00:00.000Z"
    }
    Required header: x-user-id: 42
    Allowed statuses: PENDIENTE, CONFIRMADA
  */
  @Patch(':reservation_id/times')
  @RequireUser()
  changeTimes(
    @Param('reservation_id') reservationId: string,
    @Body() dto: UpdateReservationTimesDto,
    @AuditUserId() auditUserId?: bigint,
  ) {
    return this.reservationsService.changeTimes(
      reservationId,
      dto,
      auditUserId,
    );
  }

  /*
    Sample payload:
    {
      "estatus_reserva_code": "CANCELADA"
    }
    Required header: x-user-id: 42
  */
  @Patch(':reservation_id/status')
  @RequireUser()
  changeStatus(
    @Param('reservation_id') reservationId: string,
    @Body() dto: ChangeReservationStatusDto,
    @AuditUserId() auditUserId?: bigint,
    @Req() req?: { user?: JwtPayload },
  ) {
    if (
      dto.estatus_reserva_code === 'CANCELADA' &&
      req?.user?.rol !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede cancelar reservas',
      );
    }
    return this.reservationsService.changeStatus(
      reservationId,
      dto,
      auditUserId,
    );
  }

  /*
    Sample request: DELETE /reservations/1
    Required header: x-user-id: 42
  */
  @Delete(':reservation_id')
  @RequireUser()
  remove(
    @Param('reservation_id') reservationId: string,
    @AuditUserId() auditUserId?: bigint,
  ) {
    return this.reservationsService.remove(reservationId, auditUserId);
  }
}
