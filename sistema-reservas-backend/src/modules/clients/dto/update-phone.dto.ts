import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

function normalizePhone(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  return digits;
}

export class UpdatePhoneDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @Matches(/^\+\d{7,15}$/, { message: 'Número de teléfono inválido (formato internacional requerido)' })
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
