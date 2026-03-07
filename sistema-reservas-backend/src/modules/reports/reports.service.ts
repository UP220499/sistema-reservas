import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OccupancyDay,
  RevenueMonth,
  TodayAvailabilityItem,
  TodayAvailabilityResponse,
} from './reports.types';
import {
  ACTIVE_STATS_STATUSES,
  EXCLUDED_REVENUE_STATUSES,
} from '../../shared/reservation-statuses';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Payment types that count as real income. */
const INCOME_TYPES = ['ANTICIPO', 'LIQUIDACION'] as const;

/** IANA timezone for all local-calendar calculations. */
const MX_TZ = 'America/Mexico_City';

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the UTC offset for MX_TZ at the given instant, in milliseconds.
 * CST = -6 h = -21 600 000 ms; CDT = -5 h = -18 000 000 ms.
 */
function getMxOffsetMs(at: Date): number {
  const epochOf = (tz: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(at);
    const g = (t: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === t)?.value ?? 0);
    return Date.UTC(
      g('year'),
      g('month') - 1,
      g('day'),
      g('hour'),
      g('minute'),
      g('second'),
    );
  };
  return epochOf(MX_TZ) - epochOf('UTC');
}

/** Returns MX-local date parts (year, 1-based month, day) for the given UTC instant. */
function mxLocalDate(at: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MX_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const g = (t: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: g('year'), month: g('month'), day: g('day') };
}

/** Format a Date as 'YYYY-MM-DD' in MX local calendar. */
function localDateStr(d: Date): string {
  const { year, month, day } = mxLocalDate(d);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Format a Date as 'YYYY-MM' in MX local calendar. */
function localMonthStr(d: Date): string {
  const { year, month } = mxLocalDate(d);
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Returns UTC Date for MX midnight (00:00:00 MX) of the given calendar date.
 * Uses a noon-UTC probe to safely determine the MX offset (avoids DST edge cases).
 */
function mxMidnightUtc(year: number, month1: number, day: number): Date {
  const probe = new Date(Date.UTC(year, month1 - 1, day, 12, 0, 0));
  const offsetMs = getMxOffsetMs(probe);
  // UTC midnight of that date minus the (negative) MX offset = MX midnight in UTC.
  return new Date(Date.UTC(year, month1 - 1, day) - offsetMs);
}

/**
 * Returns [todayStart, todayEnd) in MX_TZ expressed as UTC Date objects.
 *
 * Uses a shift-and-zero technique that is correct across CST ↔ CDT transitions:
 *   1. Shift now into "MX-local epoch space" (now + offsetMs).
 *   2. Zero out the sub-day portion via modulo.
 *   3. Shift back to UTC.
 *
 * Manual test plan for getAvailabilityToday:
 *   1. Create a reservation for today (any hour) with CONFIRMADA → shows OCUPADO.
 *   2. Change status to CANCELADA → refetch shows DISPONIBLE immediately.
 *   3. Change status back to CONFIRMADA → shows OCUPADO immediately.
 *   4. Create a bloqueo_calendario for today with ACTIVO → shows OCUPADO.
 *   5. Change block status to INACTIVO → shows DISPONIBLE immediately.
 */
function todayBoundsMx(): { todayStart: Date; todayEnd: Date } {
  const now = new Date();
  const offsetMs = getMxOffsetMs(now);
  // Represent now in MX-local epoch space (as if MX offset were 0).
  const mxEpochMs = now.getTime() + offsetMs;
  // Zero out the intra-day portion → MX local midnight in shifted space.
  const mxMidnightMs = mxEpochMs - (mxEpochMs % 86_400_000);
  return {
    todayStart: new Date(mxMidnightMs - offsetMs),
    todayEnd: new Date(mxMidnightMs - offsetMs + 86_400_000),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── /reports/stats ──────────────────────────────────────────────────────────

  async getStats() {
    const { todayStart, todayEnd } = todayBoundsMx();
    const { year, month } = mxLocalDate(todayStart);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthStart = mxMidnightUtc(year, month, 1);
    const monthEnd = mxMidnightUtc(nextYear, nextMonth, 1);

    const [
      checkins_hoy,
      checkouts_hoy,
      active_reservations,
      expectedAgg,
      collectedAgg,
    ] = await Promise.all([
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_STATS_STATUSES] },
          checkin_datetime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_STATS_STATUSES] },
          checkout_datetime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_STATS_STATUSES] },
        },
      }),
      // Sum of total_reserva for bookings whose check-in falls in the current
      // month, excluding cancelled reservations.
      this.prisma.reserva.aggregate({
        where: {
          checkin_datetime: { gte: monthStart, lt: monthEnd },
          estatus_reserva_code: { notIn: [...EXCLUDED_REVENUE_STATUSES] },
        },
        _sum: { total_reserva: true },
      }),
      // Sum of actual payments received this month (ANTICIPO + LIQUIDACION, > 0).
      this.prisma.pago_movimiento.aggregate({
        where: {
          fecha_pago: { gte: monthStart, lt: monthEnd },
          tipo_pago_mov_code: { in: [...INCOME_TYPES] },
          monto: { gt: 0 },
        },
        _sum: { monto: true },
      }),
    ]);

    return {
      checkins_hoy,
      checkouts_hoy,
      active_reservations,
      expected_monthly_revenue: (
        expectedAgg._sum.total_reserva ?? new Prisma.Decimal(0)
      ).toString(),
      collected_monthly_revenue: (
        collectedAgg._sum.monto ?? new Prisma.Decimal(0)
      ).toString(),
    };
  }

  // ── /reports/availability/today ─────────────────────────────────────────────

  async getAvailabilityToday(): Promise<TodayAvailabilityResponse> {
    const { todayStart, todayEnd } = todayBoundsMx();

    // Single round-trip per resource type, no N+1.
    const [locations, activeReservations, activeBlocks] = await Promise.all([
      this.prisma.ubicacion.findMany({
        where: { activa: true },
        select: { ubicacion_id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      // Reservations overlapping today [todayStart, todayEnd) whose status blocks
      // availability. Overlap condition: checkin < todayEnd AND checkout > todayStart.
      // Status changes (CANCELADA, COMPLETADA, NO_SHOW) are reflected immediately
      // because bloquea_disponibilidad is read live from cat_estatus_reserva each call.
      this.prisma.reserva.findMany({
        where: {
          checkin_datetime: { lt: todayEnd },
          checkout_datetime: { gt: todayStart },
          cat_estatus_reserva: { bloquea_disponibilidad: true },
        },
        select: {
          ubicacion_id: true,
          cliente: { select: { nombre: true } },
        },
      }),
      // Active calendar blocks overlapping today.
      this.prisma.bloqueo_calendario.findMany({
        where: {
          inicio_datetime: { lt: todayEnd },
          fin_datetime: { gt: todayStart },
          estatus_bloqueo: 'ACTIVO',
        },
        select: { ubicacion_id: true },
      }),
    ]);

    // First matching reservation wins (a location can only have one active reserva at a time).
    const reservaMap = new Map<bigint, string>();
    for (const r of activeReservations) {
      if (!reservaMap.has(r.ubicacion_id)) {
        reservaMap.set(r.ubicacion_id, r.cliente.nombre);
      }
    }

    const blockSet = new Set<bigint>(activeBlocks.map((b) => b.ubicacion_id));

    const items: TodayAvailabilityItem[] = locations.map((loc) => {
      const clienteNombre = reservaMap.get(loc.ubicacion_id);

      if (clienteNombre !== undefined) {
        return {
          ubicacion_id: loc.ubicacion_id.toString(),
          nombre: loc.nombre,
          status: 'OCUPADO',
          cliente: clienteNombre,
        };
      }

      if (blockSet.has(loc.ubicacion_id)) {
        return {
          ubicacion_id: loc.ubicacion_id.toString(),
          nombre: loc.nombre,
          status: 'OCUPADO',
          cliente: null,
        };
      }

      return {
        ubicacion_id: loc.ubicacion_id.toString(),
        nombre: loc.nombre,
        status: 'DISPONIBLE',
        cliente: null,
      };
    });

    return { items, total: items.length };
  }

  // ── /reports/occupancy ──────────────────────────────────────────────────────

  async getOccupancy(): Promise<OccupancyDay[]> {
    const { todayStart: today } = todayBoundsMx();

    // [today-29d, today+1d) → 30 calendar days including today.
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 29);

    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    // Three queries in parallel — no N+1.
    const [totalUnits, reservations, blocks] = await Promise.all([
      this.prisma.ubicacion.count({ where: { activa: true } }),
      this.prisma.reserva.findMany({
        where: {
          checkin_datetime: { lt: rangeEnd },
          checkout_datetime: { gt: rangeStart },
          cat_estatus_reserva: { bloquea_disponibilidad: true },
        },
        select: {
          ubicacion_id: true,
          checkin_datetime: true,
          checkout_datetime: true,
        },
      }),
      this.prisma.bloqueo_calendario.findMany({
        where: {
          inicio_datetime: { lt: rangeEnd },
          fin_datetime: { gt: rangeStart },
          estatus_bloqueo: 'ACTIVO',
        },
        select: {
          ubicacion_id: true,
          inicio_datetime: true,
          fin_datetime: true,
        },
      }),
    ]);

    return Array.from({ length: 30 }, (_, i) => {
      const dayStart = new Date(rangeStart);
      dayStart.setDate(dayStart.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Count distinct occupied locations for this day using [dayStart, dayEnd).
      const occupiedSet = new Set<bigint>();

      for (const r of reservations) {
        if (r.checkin_datetime < dayEnd && r.checkout_datetime > dayStart) {
          occupiedSet.add(r.ubicacion_id);
        }
      }

      for (const b of blocks) {
        if (b.inicio_datetime < dayEnd && b.fin_datetime > dayStart) {
          occupiedSet.add(b.ubicacion_id);
        }
      }

      const occupied_units = occupiedSet.size;
      const occupancy_pct =
        totalUnits > 0
          ? Math.round((occupied_units / totalUnits) * 10000) / 100
          : 0;

      return {
        date: localDateStr(dayStart),
        occupied_units,
        total_units: totalUnits,
        occupancy_pct,
      };
    });
  }

  // ── /reports/revenue ────────────────────────────────────────────────────────

  async getRevenue(): Promise<RevenueMonth[]> {
    const now = new Date();
    const { year: currentYear, month: currentMonth } = mxLocalDate(now); // month is 1-based

    // Build 6 month ranges [start, end) from oldest to current in MX timezone.
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i; // 5 → 0
      let m = currentMonth - offset;
      let y = currentYear;
      while (m < 1) {
        m += 12;
        y--;
      }
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      const start = mxMidnightUtc(y, m, 1);
      const end = mxMidnightUtc(nextY, nextM, 1);
      return { start, end };
    });

    const rangeStart = monthRanges[0].start;
    const rangeEnd = monthRanges[monthRanges.length - 1].end;

    // One query for the entire 6-month window; group in memory.
    const payments = await this.prisma.pago_movimiento.findMany({
      where: {
        fecha_pago: { gte: rangeStart, lt: rangeEnd },
        tipo_pago_mov_code: { in: [...INCOME_TYPES] },
        monto: { gt: 0 }, // exclude refunds / negative adjustments
      },
      select: {
        fecha_pago: true,
        monto: true,
      },
    });

    const revenueByMonth = new Map<string, Prisma.Decimal>();

    for (const p of payments) {
      const key = localMonthStr(p.fecha_pago);
      const current = revenueByMonth.get(key) ?? new Prisma.Decimal(0);
      revenueByMonth.set(key, current.add(p.monto));
    }

    return monthRanges.map(({ start }) => {
      const key = localMonthStr(start);
      const revenue = revenueByMonth.get(key) ?? new Prisma.Decimal(0);
      return { month: key, revenue: revenue.toString() };
    });
  }
}
