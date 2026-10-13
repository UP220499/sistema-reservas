import { PartialType } from '@nestjs/swagger';
import { CreateUbicacionDto } from './create-ubicacion.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUbicacionDto extends PartialType(CreateUbicacionDto) {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
