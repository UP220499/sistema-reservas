import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddPhoneDto)
  phones!: AddPhoneDto[];
}
