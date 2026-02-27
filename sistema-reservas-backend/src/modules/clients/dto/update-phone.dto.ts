import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

/** Strip all non-digit characters and normalise the MX country prefix. */
function normalizeMxPhone(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  // 52 + 10 digits = 12 digits → strip country code
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits.slice(2);
  }
  return digits;
}

export class UpdatePhoneDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeMxPhone(value))
  @IsString()
  @Matches(/^\d{10}$/, { message: 'phone must have 10 digits' })
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
