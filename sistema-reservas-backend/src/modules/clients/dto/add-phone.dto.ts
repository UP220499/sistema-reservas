import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

/** Normalize to E.164 format: strip spaces, keep leading +. */
function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '');
  // Legacy: bare 10-digit MX number → add +52 prefix
  if (digits.length === 10) return `+52${digits}`;
  // Legacy: 12-digit with 52 prefix
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  return digits;
}

export class AddPhoneDto {
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @Matches(/^\+\d{7,15}$/, { message: 'Número de teléfono inválido (formato internacional requerido)' })
  telefono!: string;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
