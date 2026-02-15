import { Module } from '@nestjs/common';
import { UbicacionesController } from './ubicaciones.controller';
import { UbicacionesService } from './ubicaciones.service';
import { UbicacionesRepository } from './prisma/ubicaciones.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UbicacionesController],
    providers: [UbicacionesService, UbicacionesRepository],
    exports: [UbicacionesService],
})
export class UbicacionesModule { }
