import api from './client';
import type { CalendarResponse } from '../types';

export interface CalendarFilters {
    from: string;
    to: string;
    ubicacion_id?: string;
    include?: 'all' | 'reservas' | 'bloqueos';
    page?: number;
    page_size?: number;
}

export const calendarApi = {
    findAll: async (filters: CalendarFilters): Promise<CalendarResponse> => {
        const { data } = await api.get('/calendar', { params: filters });
        return data;
    },
};
