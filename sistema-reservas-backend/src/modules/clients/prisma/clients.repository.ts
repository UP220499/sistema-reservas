import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyPaged(where: Prisma.clienteWhereInput, skip: number, take: number) {
    return this.prisma.cliente.findMany({
      where,
      skip,
      take,
      orderBy: { cliente_id: 'asc' },
      include: {
        cliente_telefono: {
          where: { activo: true, es_principal: true },
          take: 1,
        },
      },
    });
  }

  count(where: Prisma.clienteWhereInput) {
    return this.prisma.cliente.count({ where });
  }

  findById(cliente_id: bigint) {
    return this.prisma.cliente.findUnique({
      where: { cliente_id },
      include: {
        cliente_telefono: {
          where: { activo: true },
          orderBy: { es_principal: 'desc' },
        },
      },
    });
  }

  createClient(data: Prisma.clienteCreateInput) {
    return this.prisma.cliente.create({ data });
  }

  updateClient(cliente_id: bigint, data: Prisma.clienteUpdateInput) {
    return this.prisma.cliente.update({ where: { cliente_id }, data });
  }

  setClientActive(cliente_id: bigint, activo: boolean) {
    return this.prisma.cliente.update({
      where: { cliente_id },
      data: { activo },
    });
  }

  addPhone(
    cliente_id: bigint,
    data: Omit<Prisma.cliente_telefonoCreateInput, 'cliente'>,
  ) {
    return this.prisma.cliente_telefono.create({
      data: {
        ...data,
        cliente: { connect: { cliente_id } },
      },
    });
  }

  updatePhone(
    cliente_telefono_id: bigint,
    data: Prisma.cliente_telefonoUpdateInput,
  ) {
    return this.prisma.cliente_telefono.update({
      where: { cliente_telefono_id },
      data,
    });
  }

  findActivePhones(cliente_id: bigint) {
    return this.prisma.cliente_telefono.findMany({
      where: { cliente_id, activo: true },
      orderBy: { es_principal: 'desc' },
    });
  }

  findPrimaryPhone(cliente_id: bigint) {
    return this.prisma.cliente_telefono.findFirst({
      where: { cliente_id, activo: true, es_principal: true },
    });
  }

  get prismaClient() {
    return this.prisma;
  }
}
