import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { IcalSyncRepository } from './prisma/ical-sync.repository';
import { IcalSyncQueryDto } from './dto/ical-sync-query.dto';
import { parseIcalEvents } from './ical.parser';

interface IcalSyncResult {
  ubicacion_id: string;
  events_total: number;
  upserted: number;
  deactivated: number;
}

@Injectable()
export class IcalSyncService {
  constructor(private readonly icalSyncRepository: IcalSyncRepository) {}

  async syncAirbnbCalendar(query: IcalSyncQueryDto): Promise<IcalSyncResult> {
    const ubicacionId = this.parseBigInt(query.ubicacion_id, 'ubicacion_id');

    const location = await this.icalSyncRepository.findLocation(ubicacionId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const envKey = `AIRBNB_ICAL_URL_${ubicacionId.toString()}`;
    const icalUrl = process.env[envKey];
    if (!icalUrl) {
      throw new BadRequestException(
        'Airbnb iCal URL is not configured for this location',
      );
    }

    const response = await this.safeFetch(icalUrl);
    if (!response.ok) {
      throw new BadGatewayException('Unable to fetch iCal feed');
    }

    const icsContent = await response.text();
    const events = parseIcalEvents(icsContent);

    try {
      const upserted = await this.icalSyncRepository.upsertAirbnbBlocks(
        ubicacionId,
        events,
      );

      const uids = events.map((event) => event.uid);
      const deactivated =
        await this.icalSyncRepository.deactivateMissingAirbnbBlocks(
          ubicacionId,
          uids,
        );

      return {
        ubicacion_id: ubicacionId.toString(),
        events_total: events.length,
        upserted,
        deactivated,
      };
    } catch (error: unknown) {
      return this.handlePrismaErrors(error);
    }
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

  private async safeFetch(url: string): Promise<Response> {
    try {
      return await fetch(url);
    } catch {
      throw new BadGatewayException('Unable to fetch iCal feed');
    }
  }

  private handlePrismaErrors(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (this.isExclusionConstraintError(error)) {
        throw new ConflictException('Availability conflict while syncing iCal');
      }
    }

    throw new InternalServerErrorException('Internal server error');
  }

  private isExclusionConstraintError(
    error: PrismaClientKnownRequestError,
  ): boolean {
    const metaConstraint =
      typeof error.meta?.constraint === 'string'
        ? error.meta.constraint
        : undefined;
    const metaCause =
      typeof error.meta?.cause === 'string' ? error.meta.cause : undefined;

    return (
      metaConstraint?.toLowerCase().includes('ex_ocupacion_no_traslape') ||
      metaCause?.includes('23P01') ||
      error.message.includes('23P01')
    );
  }
}
