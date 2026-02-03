import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class IcalSyncQueryDto {
  @IsNumberString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  ubicacion_id!: string;
}
