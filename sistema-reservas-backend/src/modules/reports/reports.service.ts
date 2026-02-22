import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const activeStatuses = ['CONFIRMADA', 'EN_CURSO'];

    const [checkins_hoy, checkouts_hoy, active_reservations] =
      await Promise.all([
        this.prisma.reserva.count({
          where: {
            estatus_reserva_code: { in: activeStatuses },
            checkin_datetime: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),
        this.prisma.reserva.count({
          where: {
            estatus_reserva_code: { in: activeStatuses },
            checkout_datetime: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),
        this.prisma.reserva.count({
          where: {
            estatus_reserva_code: { in: activeStatuses },
          },
        }),
      ]);

    // Aggregate monthly revenue for 'INGRESO' types like ANTICIPO and LIQUIDACION
    // Reembolsos / Ajustes negativos normally have other handling, but instructions say "solo movimientos tipo ingreso"
    // Let's assume types are ANTICIPO, LIQUIDACION as typical income. Or we just sum all positive payments if there is no explicit 'INGRESO' flag.
    // Looking at the schema, it's just a string code for tipo_pago_mov_code.
    // "solo movimientos tipo ingreso" -> We will include ANTICIPO and LIQUIDACION based on typical seed data,
    // or just checking if monto > 0. Let's filter by codes: 'ANTICIPO', 'LIQUIDACION'.
    const revenueAgg = await this.prisma.pago_movimiento.aggregate({
      where: {
        fecha_pago: {
          gte: monthStart,
          lt: monthEnd,
        },
        tipo_pago_mov_code: { in: ['ANTICIPO', 'LIQUIDACION'] },
      },
      _sum: {
        monto: true,
      },
    });

    return {
      checkins_hoy,
      checkouts_hoy,
      active_reservations,
      monthly_revenue: revenueAgg._sum.monto
        ? revenueAgg._sum.monto.toString()
        : '0',
    };
  }

  getAvailabilityToday() {
    return {
      items: [],
      total: 0,
    };
  }

  getOccupancy() {
    return [];
  }

  getRevenue() {
    return [];
  }
}
