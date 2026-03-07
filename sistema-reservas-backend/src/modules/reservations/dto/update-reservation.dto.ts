import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ALL_RESERVATION_ORIGINS,
  ALL_RESERVATION_STATUSES,
} from '../../../shared/reservation-statuses';

export class UpdateReservationDto {
  @IsOptional()
  @IsISO8601()
  checkin_datetime?: string;

  @IsOptional()
  @IsISO8601()
  checkout_datetime?: string;

  @IsOptional()
  @IsIn([...ALL_RESERVATION_STATUSES], {
    message: `estatus_reserva_code must be one of: ${ALL_RESERVATION_STATUSES.join(', ')}`,
  })
  estatus_reserva_code?: string;

  @IsOptional()
  @IsIn([...ALL_RESERVATION_ORIGINS], {
    message: `origen_reserva_code must be one of: ${ALL_RESERVATION_ORIGINS.join(', ')}`,
  })
  origen_reserva_code?: string;

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
