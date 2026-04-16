import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  ALL_RESERVATION_ORIGINS,
  ALL_RESERVATION_STATUSES,
} from '../../../shared/reservation-statuses';

export class CreateReservationDto {
  @IsString()
  cliente_id!: string;

  @IsString()
  ubicacion_id!: string;

  @IsIn([...ALL_RESERVATION_ORIGINS], {
    message: `origen_reserva_code must be one of: ${ALL_RESERVATION_ORIGINS.join(', ')}`,
  })
  origen_reserva_code!: string;

  @IsOptional()
  @IsIn([...ALL_RESERVATION_STATUSES], {
    message: `estatus_reserva_code must be one of: ${ALL_RESERVATION_STATUSES.join(', ')}`,
  })
  estatus_reserva_code?: string;

  @IsISO8601()
  checkin_datetime!: string;

  @IsISO8601()
  checkout_datetime!: string;

  @Transform(({ value }: { value: unknown }) => {
    // Absent/empty/whitespace → undefined so @IsDefined fires "is required".
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : NaN; // invalid string → NaN → @IsNumber fires
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : NaN;
    }

    return NaN;
  })
  @IsOptional()
  @ValidateIf((o: CreateReservationDto) => o.total_reserva !== undefined)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'total_reserva must be a valid number' },
  )
  total_reserva?: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  source_block_id?: string;
}
