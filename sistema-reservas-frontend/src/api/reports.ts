
import api from './client'; // Assuming auth.ts exports the configured axios instance 'api'

export interface DashboardStats {
    checkins_hoy: number;
    checkouts_hoy: number;
    active_reservations: number;
    /** Suma del total_reserva de reservas activas/confirmadas del mes. */
    expected_monthly_revenue: string | number;
    /** Suma de pagos cobrados (ANTICIPO + LIQUIDACION) del mes. */
    collected_monthly_revenue: string | number;
}

/** Shape returned by GET /reports/occupancy */
export interface OccupancyPoint {
    date: string;
    occupied_units: number;
    total_units: number;
    occupancy_pct: number;
}

/** Shape returned by GET /reports/revenue (revenue normalised to number) */
export interface RevenuePoint {
    month: string;
    revenue: number;
}

/** Raw backend shape — Prisma serialises Decimal as string */
interface RevenuePointRaw {
    month: string;
    revenue: string;
}

export interface TodayAvailability {
    ubicacion_id: string;
    nombre: string;
    status: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO';
    cliente?: string;
}

export const reportsApi = {
    getStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get<DashboardStats>('/reports/stats');
        return data;
    },
    getOccupancy: async (): Promise<OccupancyPoint[]> => {
        const { data } = await api.get<OccupancyPoint[]>('/reports/occupancy');
        return data;
    },
    getRevenue: async (): Promise<RevenuePoint[]> => {
        const { data } = await api.get<RevenuePointRaw[]>('/reports/revenue');
        return data.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
    },
    getTodayAvailability: async (): Promise<TodayAvailability[] | { items: TodayAvailability[]; total: number }> => {
        const { data } = await api.get<TodayAvailability[] | { items: TodayAvailability[]; total: number }>('/reports/availability/today');
        return data;
    },
};
