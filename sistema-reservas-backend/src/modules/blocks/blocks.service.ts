import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BlocksRepository } from './prisma/blocks.repository';
import { CreateBlockDto } from './dto/create-block.dto';
import { BlockQueryDto } from './dto/block-query.dto';
import { BlockMapper, BlockResponse } from './mappers/block.mapper';

interface BlockListResponse {
  items: BlockResponse[];
  page: number;
  page_size: number;
  total: number;
}

@Injectable()
export class BlocksService {
  constructor(private readonly blocksRepository: BlocksRepository) {}

  async create(dto: CreateBlockDto): Promise<BlockResponse> {
    const ubicacionId = this.parseBigInt(dto.ubicacion_id, 'ubicacion_id');
    const startDate = this.parseDate(dto.inicio_datetime, 'inicio_datetime');
    const endDate = this.parseDate(dto.fin_datetime, 'fin_datetime');

    if (endDate <= startDate) {
      throw new BadRequestException(
        'fin_datetime must be after inicio_datetime',
      );
    }

    const location = await this.blocksRepository.findLocationById(ubicacionId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const data: Prisma.bloqueo_calendarioCreateInput = {
      inicio_datetime: startDate,
      fin_datetime: endDate,
      estatus_bloqueo: dto.estatus_bloqueo?.trim() || 'ACTIVO',
      external_uid: dto.external_uid ?? null,
      raw_payload: dto.raw_payload ?? null,
      cat_origen_bloqueo: {
        connect: { origen_bloqueo_code: dto.origen_bloqueo_code },
      },
      ubicacion: {
        connect: { ubicacion_id: ubicacionId },
      },
    };

    try {
      const created = await this.blocksRepository.createBlock(data);
      return BlockMapper.toResponse(created);
    } catch (error: unknown) {
      this.handleKnownErrors(error);
      throw error;
    }
  }

  async findAll(query: BlockQueryDto): Promise<BlockListResponse> {
    const page = query.page ?? 1;
    const requestedPageSize = query.page_size ?? 20;
    const pageSize = Math.min(requestedPageSize, 100);
    const skip = (page - 1) * pageSize;

    const andFilters: Prisma.bloqueo_calendarioWhereInput[] = [];

    if (query.ubicacion_id) {
      const ubicacionId = this.parseBigInt(query.ubicacion_id, 'ubicacion_id');
      andFilters.push({ ubicacion_id: ubicacionId });
    }

    let fromDate: Date | undefined;
    if (query.from) {
      fromDate = this.parseLocalDay(query.from, 'from');
      // overlap: block ends after the range start
      andFilters.push({ fin_datetime: { gt: fromDate } });
    }

    // toDate is the exclusive upper bound: start-of-day(to) + 1 day
    // so that "to=today" includes blocks that start on today.
    let toExclusive: Date | undefined;
    if (query.to) {
      const toStart = this.parseLocalDay(query.to, 'to');
      toExclusive = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
      // overlap: block starts before the exclusive upper bound
      andFilters.push({ inicio_datetime: { lt: toExclusive } });
    }

    if (fromDate && toExclusive && toExclusive <= fromDate) {
      throw new BadRequestException('to must be greater than or equal to from');
    }

    if (query.estatus_bloqueo) {
      andFilters.push({ estatus_bloqueo: query.estatus_bloqueo });
    }

    if (query.origen_bloqueo_code) {
      andFilters.push({ origen_bloqueo_code: query.origen_bloqueo_code });
    }

    const where: Prisma.bloqueo_calendarioWhereInput =
      andFilters.length > 0 ? { AND: andFilters } : {};

    const items = await this.blocksRepository.findManyPaged(
      where,
      skip,
      pageSize,
    );
    const total = await this.blocksRepository.count(where);

    return {
      items: items.map((item) => BlockMapper.toResponse(item)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async findOne(bloqueoIdParam: string): Promise<BlockResponse> {
    const bloqueoId = this.parseBigInt(bloqueoIdParam, 'bloqueo_id');
    const block = await this.blocksRepository.findById(bloqueoId);

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    return BlockMapper.toResponse(block);
  }

  async changeStatus(
    bloqueoIdParam: string,
    estatusBloqueo: string,
  ): Promise<BlockResponse> {
    if (!estatusBloqueo || !estatusBloqueo.trim()) {
      throw new BadRequestException('estatus_bloqueo is required');
    }

    const bloqueoId = this.parseBigInt(bloqueoIdParam, 'bloqueo_id');

    const existing = await this.blocksRepository.findById(bloqueoId);
    if (!existing) {
      throw new NotFoundException('Block not found');
    }

    const normalizedStatus = estatusBloqueo.trim();

    const updated = await this.blocksRepository.updateStatus(
      bloqueoId,
      normalizedStatus,
      new Date(),
    );

    return BlockMapper.toResponse(updated);
  }

  private parseBigInt(value: string, field: string): bigint {
    try {
      const parsed = BigInt(value);
      if (parsed <= 0n) {
        throw new BadRequestException(
          `${field} must be a positive integer string`,
        );
      }
      return parsed;
    } catch {
      throw new BadRequestException(
        `${field} must be a positive integer string`,
      );
    }
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }
    return date;
  }

  // Parses a YYYY-MM-DD (or full ISO datetime) string as LOCAL midnight.
  // A bare date string like "2026-03-09" is spec-parsed as UTC by `new Date()`,
  // which can shift the boundary by hours. Appending T00:00:00 (no Z) forces
  // local-time interpretation.
  private parseLocalDay(value: string, field: string): Date {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
      ? `${value.trim()}T00:00:00`
      : value.trim();
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${field} must be a valid date (YYYY-MM-DD)`,
      );
    }
    return date;
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      const overlapCodes = new Set([
        'P2002',
        'P2004',
        'P2010',
        'P2014',
        'P2033',
      ]);
      if (overlapCodes.has(error.code)) {
        throw new BadRequestException(
          'Location not available for given period',
        );
      }

      if (error.code === 'P2003') {
        const fieldName = this.extractFieldName(error);
        if (fieldName?.includes('ubicacion')) {
          throw new NotFoundException('Location not found');
        }
        if (fieldName?.includes('origen')) {
          throw new BadRequestException('Origin code not found');
        }
      }
    }

    throw error;
  }

  private extractFieldName(
    error: PrismaClientKnownRequestError,
  ): string | undefined {
    const metaField = error.meta?.field_name;
    if (typeof metaField === 'string') {
      return metaField;
    }

    if (this.isStringArray(metaField) && metaField.length > 0) {
      return metaField[0];
    }

    return undefined;
  }

  private isStringArray(value: unknown): value is string[] {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every((item) => typeof item === 'string');
  }
}
