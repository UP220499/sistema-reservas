import { Controller, Get } from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Ubicaciones')
@Controller('ubicaciones')
export class UbicacionesController {
    constructor(private readonly ubicacionesService: UbicacionesService) { }

    @Get()
    findAll() {
        return this.ubicacionesService.findAll();
    }
}
