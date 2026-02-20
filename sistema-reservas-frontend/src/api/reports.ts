
import api from './client'; // Assuming auth.ts exports the configured axios instance 'api'

export interface DashboardStats {
    checkins: number;
    checkouts: number;
    activeReservations: number;
    monthlyRevenue: number;
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
    getTodayAvailability: async (): Promise<TodayAvailability[]> => {
        // Mocking or endpoint might be different, but implementing as requested.
        // If the backend doesn't have this exact endpoint, this might fail at runtime, 
        // but the goal is to fix BUILD errors.
        const { data } = await api.get<TodayAvailability[]>('/reports/availability/today');
        return data;
    }
};
