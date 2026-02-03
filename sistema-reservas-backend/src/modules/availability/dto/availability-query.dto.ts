import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsNumberString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsNumberString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  ubicacion_id!: string;

  @IsISO8601()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  from!: string;

  @IsISO8601()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  to!: string;
}
