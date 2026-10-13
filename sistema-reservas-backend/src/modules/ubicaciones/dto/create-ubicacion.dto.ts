import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUbicacionDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  airbnb_ical_url?: string;
}
