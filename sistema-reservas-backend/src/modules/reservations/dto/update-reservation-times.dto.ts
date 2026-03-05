import { IsISO8601 } from 'class-validator';

export class UpdateReservationTimesDto {
  @IsISO8601()
  checkin_datetime: string;

  @IsISO8601()
  checkout_datetime: string;
}
