import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ChangeStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  active!: boolean;
}
