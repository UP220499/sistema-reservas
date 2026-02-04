import { BadRequestException, Injectable } from '@nestjs/common';
import { CalendarRepository } from './prisma/calendar.repository';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import {
  CalendarEventResponse,
  mapBlockEvent,
  mapReservationEvent,
} from './calendar.mapper';

@Injectable()
export class CalendarService {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  async findAll(query: CalendarQueryDto): Promise<{
    items: CalendarEventResponse[];
    page: number;
    page_size: number;
    total: number;
  }> {
    const from = this.parseDate(query.from, 'from');
    const to = this.parseDate(query.to, 'to');

    if (to.getTime() <= from.getTime()) {
      throw new BadRequestException('to must be greater than from');
    }

    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const include = query.include ?? 'all';

    const ubicacionId = query.ubicacion_id
      ? this.parseBigInt(query.ubicacion_id, 'ubicacion_id')
      : undefined;

    const includeReservations = include === 'all' || include === 'reservas';
    const includeBlocks = include === 'all' || include === 'bloqueos';

    const [reservations, blocks] = await Promise.all([
      includeReservations
        ? this.calendarRepository.findReservations({ from, to, ubicacionId })
        : Promise.resolve([]),
      includeBlocks
        ? this.calendarRepository.findBlocks({ from, to, ubicacionId })
        : Promise.resolve([]),
    ]);

    const items = [
      ...reservations.map((reservation) => mapReservationEvent(reservation)),
      ...blocks.map((block) => mapBlockEvent(block)),
    ];

    items.sort((a, b) => {
      const diff =
        new Date(a.inicio_datetime).getTime() -
        new Date(b.inicio_datetime).getTime();

      if (diff !== 0) {
        return diff;
      }

      if (a.tipo !== b.tipo) {
        // Prioritize bloqueos when events start at the same time.
        return a.tipo === 'BLOQUEO' ? -1 : 1;
      }

      return a.id.localeCompare(b.id);
    });

    const total = items.length;
    const skip = (page - 1) * pageSize;
    const pagedItems = items.slice(skip, skip + pageSize);

    return {
      items: pagedItems,
      page,
      page_size: pageSize,
      total,
    };
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }

    return date;
  }

  private parseBigInt(value: string, field: string): bigint {
    try {
      return BigInt(value);
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadRequestException(`${field} must be a valid number`, {
        cause: normalizedError,
      });
    }
  }
}
