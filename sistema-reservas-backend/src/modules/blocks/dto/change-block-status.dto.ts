import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeBlockStatusDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  estatus_bloqueo!: string;
}
