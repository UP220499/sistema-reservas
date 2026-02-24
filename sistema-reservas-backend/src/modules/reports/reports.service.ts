import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OccupancyDay,
  RevenueMonth,
  TodayAvailabilityItem,
  TodayAvailabilityResponse,
} from './reports.types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Payment types that count as real income. */
const INCOME_TYPES = ['ANTICIPO', 'LIQUIDACION'] as const;

/** Reservation statuses that count as "active" for check-in/out/count. */
const ACTIVE_RESERVATION_STATUSES = ['CONFIRMADA', 'EN_CURSO'] as const;

/** Reservation statuses excluded from expected-revenue totals. */
const EXCLUDED_REVENUE_STATUSES = ['CANCELADA'] as const;

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Format a Date as 'YYYY-MM-DD' using local calendar. */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a Date as 'YYYY-MM' using local calendar. */
function localMonthStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── /reports/stats ──────────────────────────────────────────────────────────

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1,
    );
    const monthEnd = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth() + 1,
      1,
    );

    const [
      checkins_hoy,
      checkouts_hoy,
      active_reservations,
      expectedAgg,
      collectedAgg,
    ] = await Promise.all([
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_RESERVATION_STATUSES] },
          checkin_datetime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_RESERVATION_STATUSES] },
          checkout_datetime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.reserva.count({
        where: {
          estatus_reserva_code: { in: [...ACTIVE_RESERVATION_STATUSES] },
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
    const now = new Date();

    // Single round-trip per resource type, no N+1.
    const [locations, activeReservations, activeBlocks] = await Promise.all([
      this.prisma.ubicacion.findMany({
        where: { activa: true },
        select: { ubicacion_id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      // Reservations where now ∈ [checkin, checkout) AND status blocks availability.
      this.prisma.reserva.findMany({
        where: {
          checkin_datetime: { lte: now },
          checkout_datetime: { gt: now },
          cat_estatus_reserva: { bloquea_disponibilidad: true },
        },
        select: {
          ubicacion_id: true,
          cliente: { select: { nombre: true } },
        },
      }),
      // Active calendar blocks where now ∈ [inicio, fin).
      this.prisma.bloqueo_calendario.findMany({
        where: {
          inicio_datetime: { lte: now },
          fin_datetime: { gt: now },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based

    // Build 6 month ranges [start, end) from oldest to current.
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i; // 5 → 0
      const start = new Date(currentYear, currentMonth - offset, 1);
      const end = new Date(currentYear, currentMonth - offset + 1, 1);
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
