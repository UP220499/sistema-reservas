// Env keys: ICAL_SYNC_ENABLED, ICAL_SYNC_CRON, ICAL_SYNC_EVERY_MINUTES
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IcalSyncService } from './ical-sync.service';
import { IcalSyncRepository } from './prisma/ical-sync.repository';

const DEFAULT_CRON_EXPRESSION = '*/15 * * * *';

function resolveCronExpression(): string {
  const explicitCron = process.env.ICAL_SYNC_CRON?.trim();
  if (explicitCron) {
    return explicitCron;
  }

  const everyMinutesRaw = process.env.ICAL_SYNC_EVERY_MINUTES?.trim();
  if (everyMinutesRaw) {
    const parsedMinutes = Number(everyMinutesRaw);
    if (Number.isFinite(parsedMinutes) && parsedMinutes > 0) {
      const minutes = Math.max(1, Math.floor(parsedMinutes));
      return `*/${minutes} * * * *`;
    }
  }

  return DEFAULT_CRON_EXPRESSION;
}

const CRON_EXPRESSION = resolveCronExpression();

@Injectable()
export class IcalSyncCron {
  private readonly logger = new Logger(IcalSyncCron.name);

  constructor(
    private readonly icalSyncService: IcalSyncService,
    private readonly icalSyncRepository: IcalSyncRepository,
  ) {}

  @Cron(CRON_EXPRESSION)
  async handleSync(): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug('Skipping iCal sync: ICAL_SYNC_ENABLED is not true.');
      return;
    }

    const verbose = this.isVerbose();
    const locations = await this.icalSyncRepository.findActiveLocations();

    const totals = {
      total: locations.length,
      attempted: 0,
      skipped: 0,
      succeeded: 0,
      failed: 0,
    };
    const failureSummaries: string[] = [];

    if (locations.length === 0 && verbose) {
      this.logger.debug('Skipping iCal sync: no active locations found.');
    }

    for (const location of locations) {
      const locationId = location.ubicacion_id.toString();
      const envKey = `AIRBNB_ICAL_URL_${locationId}`;
      const feedUrl = process.env[envKey]?.trim();

      if (!feedUrl) {
        totals.skipped += 1;
        if (verbose) {
          this.logger.log(
            `Skipping location ${locationId}: Airbnb iCal URL not configured.`,
          );
        }
        continue;
      }

      totals.attempted += 1;
      try {
        const result = await this.icalSyncService.syncAirbnbCalendar({
          ubicacion_id: locationId,
        });

        totals.succeeded += 1;
        if (verbose) {
          this.logger.log(
            `Synced location ${locationId}: total=${result.events_total} upserted=${result.upserted} deactivated=${result.deactivated}.`,
          );
        }
      } catch (error: unknown) {
        totals.failed += 1;
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        if (verbose) {
          this.logger.error(
            `Failed to sync location ${locationId}: ${message}.`,
          );
        }
        failureSummaries.push(`${locationId}:${message}`);
      }
    }

    const summaryParts = [
      `total=${totals.total}`,
      `attempted=${totals.attempted}`,
      `skipped=${totals.skipped}`,
      `succeeded=${totals.succeeded}`,
      `failed=${totals.failed}`,
    ];

    if (failureSummaries.length > 0) {
      summaryParts.push(`failures=[${failureSummaries.join(', ')}]`);
    }

    this.logger.log(`iCal sync summary: ${summaryParts.join(' ')}`);
  }

  private isEnabled(): boolean {
    const rawValue = process.env.ICAL_SYNC_ENABLED;
    if (!rawValue) {
      return false;
    }

    const normalized = rawValue.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  private isVerbose(): boolean {
    const rawValue = process.env.ICAL_SYNC_VERBOSE;
    if (!rawValue) {
      return false;
    }

    const normalized = rawValue.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
}
