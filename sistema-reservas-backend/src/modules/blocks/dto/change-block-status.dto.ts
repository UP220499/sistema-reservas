import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';

export class ChangeBlockStatusDto {
  @IsIn(['ACTIVO', 'INACTIVO'], {
    message: 'estatus_bloqueo must be ACTIVO or INACTIVO',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  estatus_bloqueo!: string;
}
