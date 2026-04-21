import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AddPhoneDto } from './add-phone.dto';

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsEmail()
  correo?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPhoneDto)
  phones?: AddPhoneDto[];
}
