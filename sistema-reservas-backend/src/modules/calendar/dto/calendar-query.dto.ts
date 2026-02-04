import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

function transformPageLike(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function transformTrim(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  return undefined;
}

export class CalendarQueryDto {
  @Transform(({ value }: { value: unknown }) => transformTrim(value))
  @IsISO8601({ strict: true })
  from!: string;

  @Transform(({ value }: { value: unknown }) => transformTrim(value))
  @IsISO8601({ strict: true })
  to!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformTrim(value))
  @IsNumberString()
  ubicacion_id?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformPageLike(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformPageLike(value))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => transformTrim(value))
  @IsIn(['all', 'reservas', 'bloqueos'])
  include?: 'all' | 'reservas' | 'bloqueos';
}
