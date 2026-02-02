import { IsOptional, IsString } from 'class-validator';

export class ChangeReservationStatusDto {
  @IsString()
  estatus_reserva_code!: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
