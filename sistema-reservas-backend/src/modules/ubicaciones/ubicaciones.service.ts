import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UbicacionesRepository } from './prisma/ubicaciones.repository';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

@Injectable()
export class UbicacionesService {
  constructor(private readonly ubicacionesRepository: UbicacionesRepository) {}

  async findAll(includeInactive = false) {
    const rows = await this.ubicacionesRepository.findAll(includeInactive);
    return rows.map((row) => ({
      ubicacion_id: row.ubicacion_id.toString(),
      nombre: row.nombre,
      activa: row.activa,
      airbnb_ical_url: row.airbnb_ical_url,
    }));
  }

  async create(dto: CreateUbicacionDto) {
    try {
      const created = await this.ubicacionesRepository.create({
        nombre: dto.nombre,
        airbnb_ical_url: dto.airbnb_ical_url,
      });
      return {
        ubicacion_id: created.ubicacion_id.toString(),
        nombre: created.nombre,
        activa: created.activa,
        airbnb_ical_url: created.airbnb_ical_url,
      };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe una ubicación con este nombre');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateUbicacionDto) {
    const uId = this.parseId(id);
    const existing = await this.ubicacionesRepository.findById(uId);
    if (!existing) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    try {
      const updated = await this.ubicacionesRepository.update(uId, dto);
      return {
        ubicacion_id: updated.ubicacion_id.toString(),
        nombre: updated.nombre,
        activa: updated.activa,
        airbnb_ical_url: updated.airbnb_ical_url,
      };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe una ubicación con este nombre');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const uId = this.parseId(id);
    const existing = await this.ubicacionesRepository.findById(uId);
    if (!existing) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    const updated = await this.ubicacionesRepository.softDelete(uId);
    return {
      ubicacion_id: updated.ubicacion_id.toString(),
      nombre: updated.nombre,
      activa: updated.activa,
      airbnb_ical_url: updated.airbnb_ical_url,
    };
  }

  private parseId(value: string): bigint {
    try {
      return BigInt(value);
    } catch (error) {
      throw new BadRequestException('ID de ubicación inválido');
    }
  }
}
