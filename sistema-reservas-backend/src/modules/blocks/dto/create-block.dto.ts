import { Transform } from 'class-transformer';
import {
  IsISO8601,
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
  @IsString()
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
  @IsString()
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
}
