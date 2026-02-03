import { Injectable } from '@nestjs/common';
import { Prisma, bloqueo_calendario, ubicacion } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BlocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLocationById(ubicacion_id: bigint): Promise<ubicacion | null> {
    return this.prisma.ubicacion.findUnique({ where: { ubicacion_id } });
  }

  createBlock(
    data: Prisma.bloqueo_calendarioCreateInput,
  ): Promise<bloqueo_calendario> {
    return this.prisma.bloqueo_calendario.create({ data });
  }

  findManyPaged(
    where: Prisma.bloqueo_calendarioWhereInput,
    skip: number,
    take: number,
  ): Promise<bloqueo_calendario[]> {
    return this.prisma.bloqueo_calendario.findMany({
      where,
      skip,
      take,
      orderBy: { inicio_datetime: 'asc' },
    });
  }

  count(where: Prisma.bloqueo_calendarioWhereInput): Promise<number> {
    return this.prisma.bloqueo_calendario.count({ where });
  }

  findById(bloqueo_id: bigint): Promise<bloqueo_calendario | null> {
    return this.prisma.bloqueo_calendario.findUnique({ where: { bloqueo_id } });
  }

  updateStatus(
    bloqueo_id: bigint,
    estatus_bloqueo: string,
    updatedAt: Date,
  ): Promise<bloqueo_calendario> {
    return this.prisma.bloqueo_calendario.update({
      where: { bloqueo_id },
      data: {
        estatus_bloqueo,
        updated_at: updatedAt,
      },
    });
  }
}
