import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import {
  AvailabilityRepository,
  BlockConflictRecord,
  ReservationConflictRecord,
} from './prisma/availability.repository';
import {
  AvailabilityConflict,
  AvailabilityMapper,
  AvailabilityResponse,
} from './mappers/availability.mapper';

interface ConflictWrapper {
  sortKey: number;
  payload: AvailabilityConflict;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  async checkAvailability(
    query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponse> {
    const ubicacionId = this.parseBigInt(query.ubicacion_id, 'ubicacion_id');
    const fromDate = this.parseDate(query.from, 'from');
    const toDate = this.parseDate(query.to, 'to');

    if (toDate <= fromDate) {
      throw new BadRequestException('to must be after from');
    }

    const location =
      await this.availabilityRepository.findLocationById(ubicacionId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const conflictPromises: [
      Promise<ReservationConflictRecord[]>,
      Promise<BlockConflictRecord[]>,
    ] = [
      this.availabilityRepository.getReservationConflicts(
        ubicacionId,
        fromDate,
        toDate,
      ),
      this.availabilityRepository.getBlockConflicts(
        ubicacionId,
        fromDate,
        toDate,
      ),
    ];

    const [reservations, blocks] = await Promise.all(conflictPromises);

    const conflicts = this.mergeConflicts(reservations, blocks);

    return AvailabilityMapper.buildResponse(
      ubicacionId,
      fromDate,
      toDate,
      conflicts,
    );
  }

  private mergeConflicts(
    reservations: ReservationConflictRecord[],
    blocks: BlockConflictRecord[],
  ): AvailabilityConflict[] {
    const wrappedConflicts: ConflictWrapper[] = [
      ...reservations.map((record) => ({
        sortKey: record.checkin_datetime.getTime(),
        payload: AvailabilityMapper.fromReservation(record),
      })),
      ...blocks.map((record) => ({
        sortKey: record.inicio_datetime.getTime(),
        payload: AvailabilityMapper.fromBlock(record),
      })),
    ];

    wrappedConflicts.sort((a, b) => a.sortKey - b.sortKey);

    return wrappedConflicts.map((item) => item.payload);
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
}
