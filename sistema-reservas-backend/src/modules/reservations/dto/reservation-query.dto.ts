import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

function toOptionalNumber(value: unknown): number | undefined {
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
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  return undefined;
}

export class ReservationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 20;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalString(value))
  @IsString()
  ubicacion_id?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalString(value))
  @IsString()
  cliente_id?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalString(value))
  @IsString()
  estatus_reserva_code?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalString(value))
  @IsString()
  origen?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
