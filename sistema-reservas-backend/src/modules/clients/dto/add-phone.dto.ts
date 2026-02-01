import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddPhoneDto {
  @IsString()
  telefono!: string;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
