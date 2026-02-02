import { Transform } from 'class-transformer';
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  cliente_id!: string;

  @IsString()
  ubicacion_id!: string;

  @IsString()
  origen_reserva_code!: string;

  @IsOptional()
  @IsString()
  estatus_reserva_code?: string;

  @IsISO8601()
  checkin_datetime!: string;

  @IsISO8601()
  checkout_datetime!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  total_reserva?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
