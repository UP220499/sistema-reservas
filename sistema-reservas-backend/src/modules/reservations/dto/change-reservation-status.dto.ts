import { IsString } from 'class-validator';

export class ChangeReservationStatusDto {
  @IsString()
  estatus_reserva_code!: string;
}
