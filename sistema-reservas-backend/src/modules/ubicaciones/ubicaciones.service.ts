import { Injectable } from '@nestjs/common';
import { UbicacionesRepository } from './prisma/ubicaciones.repository';

@Injectable()
export class UbicacionesService {
  constructor(private readonly ubicacionesRepository: UbicacionesRepository) {}

  async findAll() {
    const rows = await this.ubicacionesRepository.findAll();
    return rows.map((row) => ({
      ubicacion_id: row.ubicacion_id.toString(),
      nombre: row.nombre,
      activa: row.activa,
    }));
  }
}
