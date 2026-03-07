import { IsIn } from 'class-validator';
import { ALL_RESERVATION_STATUSES } from '../../../shared/reservation-statuses';

export class ChangeReservationStatusDto {
  @IsIn([...ALL_RESERVATION_STATUSES], {
    message: `estatus_reserva_code must be one of: ${ALL_RESERVATION_STATUSES.join(', ')}`,
  })
  estatus_reserva_code!: string;
}
