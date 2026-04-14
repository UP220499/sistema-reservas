import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBlockDto {
  @IsNumberString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  ubicacion_id!: string;

  @IsOptional()
  @IsIn(['MANUAL', 'AIRBNB'], {
    message: 'origen_bloqueo_code must be MANUAL or AIRBNB',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  origen_bloqueo_code?: string;

  @IsISO8601()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  inicio_datetime!: string;

  @IsISO8601()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  fin_datetime!: string;

  @IsOptional()
  @IsIn(['ACTIVO', 'INACTIVO'], {
    message: 'estatus_bloqueo must be ACTIVO or INACTIVO',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  estatus_bloqueo?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  external_uid?: string;

  @IsOptional()
  @IsString()
  raw_payload?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  notas?: string;
}
