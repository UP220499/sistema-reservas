import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { RequireUser } from '../../common/decorators/require-user.decorator';

@ApiTags('Ubicaciones')
@Controller('ubicaciones')
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.ubicacionesService.findAll(includeInactive === 'true');
  }

  @Post()
  @RequireUser()
  create(@Body() dto: CreateUbicacionDto) {
    return this.ubicacionesService.create(dto);
  }

  @Put(':id')
  @RequireUser()
  update(@Param('id') id: string, @Body() dto: UpdateUbicacionDto) {
    return this.ubicacionesService.update(id, dto);
  }

  @Delete(':id')
  @RequireUser()
  remove(@Param('id') id: string) {
    return this.ubicacionesService.remove(id);
  }
}
