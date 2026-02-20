import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UbicacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ubicacion.findMany({
      where: { activa: true },
      select: { ubicacion_id: true, nombre: true, activa: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
