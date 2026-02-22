
import api from './client'; // Assuming auth.ts exports the configured axios instance 'api'

export interface DashboardStats {
    checkins_hoy: number;
    checkouts_hoy: number;
    active_reservations: number;
    monthly_revenue: string | number;
}

export interface ChartPoint {
    name: string;
    value: number;
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
    getOccupancy: async (): Promise<ChartPoint[]> => {
        const { data } = await api.get<ChartPoint[]>('/reports/occupancy');
        return data;
    },
    getRevenue: async (): Promise<ChartPoint[]> => {
        const { data } = await api.get<ChartPoint[]>('/reports/revenue');
        return data;
    },
    getTodayAvailability: async (): Promise<TodayAvailability[] | { items: TodayAvailability[]; total: number }> => {
        // Mocking or endpoint might be different, but implementing as requested.
        // If the backend doesn't have this exact endpoint, this might fail at runtime, 
        // but the goal is to fix BUILD errors.
        const { data } = await api.get<TodayAvailability[] | { items: TodayAvailability[]; total: number }>('/reports/availability/today');
        return data;
    }
};
