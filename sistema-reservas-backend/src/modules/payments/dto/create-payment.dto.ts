import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error('Invalid number');
}

export class CreatePaymentDto {
  @IsString()
  @IsIn(['ANTICIPO', 'LIQUIDACION'], {
    message: 'tipo_pago_mov_code must be ANTICIPO or LIQUIDACION',
  })
  tipo_pago_mov_code!: string;

  @IsString()
  @IsIn(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'], {
    message: 'metodo_pago_code must be EFECTIVO, TRANSFERENCIA, or TARJETA',
  })
  metodo_pago_code!: string;

  @Transform(({ value }) => toNumber(value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01, { message: 'monto debe ser mayor a 0' })
  monto!: number;

  @IsISO8601()
  fecha_pago!: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
