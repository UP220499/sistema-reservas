import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UbicacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.ubicacion.findMany({
      where: includeInactive ? undefined : { activa: true },
      select: { ubicacion_id: true, nombre: true, activa: true, airbnb_ical_url: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findById(ubicacion_id: bigint) {
    return this.prisma.ubicacion.findUnique({
      where: { ubicacion_id },
      select: { ubicacion_id: true, nombre: true, activa: true, airbnb_ical_url: true },
    });
  }

  create(data: { nombre: string; airbnb_ical_url?: string }) {
    return this.prisma.ubicacion.create({
      data: { ...data, activa: true },
    });
  }

  update(ubicacion_id: bigint, data: { nombre?: string; airbnb_ical_url?: string; activa?: boolean }) {
    return this.prisma.ubicacion.update({
      where: { ubicacion_id },
      data,
    });
  }

  softDelete(ubicacion_id: bigint) {
    return this.prisma.ubicacion.update({
      where: { ubicacion_id },
      data: { activa: false },
    });
  }
}
