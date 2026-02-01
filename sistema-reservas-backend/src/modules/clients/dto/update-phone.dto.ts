import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePhoneDto {
  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
