import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { IcalSyncRepository } from './prisma/ical-sync.repository';
import { IcalSyncQueryDto } from './dto/ical-sync-query.dto';
import { parseIcalEvents } from './ical.parser';
import { extractIcalErrorInfo } from './utils/error-info.util';

interface IcalSyncResult {
  ubicacion_id: string;
  events_total: number;
  upserted: number;
  deactivated: number;
}

@Injectable()
export class IcalSyncService {
  private readonly logger = new Logger(IcalSyncService.name);

  constructor(private readonly icalSyncRepository: IcalSyncRepository) {}

  async syncAirbnbCalendar(query: IcalSyncQueryDto): Promise<IcalSyncResult> {
    const rawUbicacionId = query.ubicacion_id;
    let ubicacionId: bigint | undefined;

    try {
      ubicacionId = this.parseBigInt(query.ubicacion_id, 'ubicacion_id');

      const location = await this.icalSyncRepository.findLocation(ubicacionId);
      if (!location) {
        throw new NotFoundException('Location not found');
      }

      const icalUrl = (location as any).airbnb_ical_url;
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

      const { created, reactivated, deactivated } =
        await this.icalSyncRepository.upsertAirbnbBlocks(ubicacionId, events);

      const upserted = created + reactivated;

      this.logger.log(
        `Replaced Airbnb blocks for location ${ubicacionId.toString()}: ` +
          `created=${created} reactivated=${reactivated} deactivated=${deactivated}`,
      );

      return {
        ubicacion_id: ubicacionId.toString(),
        events_total: events.length,
        upserted,
        deactivated,
      };
    } catch (error: unknown) {
      const ubicacionForLog =
        ubicacionId?.toString() ?? rawUbicacionId ?? 'unknown';

      this.logSyncError(ubicacionForLog, error);
      this.normalizeAndRethrow(error);
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
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      throw new BadGatewayException('Unable to fetch iCal feed', {
        cause: normalizedError,
      });
    }
  }

  private logSyncError(ubicacionId: string, error: unknown): void {
    const info = extractIcalErrorInfo(error);

    const messageParts = [
      `Failed to sync Airbnb calendar for location ${ubicacionId}`,
      `type=${info.error_type}`,
      `message=${info.message}`,
    ];

    if (info.prisma_code) {
      messageParts.push(`prisma_code=${info.prisma_code}`);
    }

    if (info.prisma_meta_cause) {
      messageParts.push(`prisma_meta_cause=${info.prisma_meta_cause}`);
    }

    if (info.postgres_code) {
      messageParts.push(`postgres_code=${info.postgres_code}`);
    }

    const logMessage = messageParts.join(' ');
    this.logger.error(logMessage, info.stack ?? info.message);
  }

  private normalizeAndRethrow(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (this.isExclusionConstraintError(error)) {
        throw new ConflictException(
          'Overlap conflict while syncing Airbnb blocks',
          {
            cause: error,
          },
        );
      }

      throw new InternalServerErrorException('Internal server error', {
        cause: error,
      });
    }

    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    throw new InternalServerErrorException('Internal server error', {
      cause: normalizedError,
    });
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
