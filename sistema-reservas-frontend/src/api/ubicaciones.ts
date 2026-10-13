import api from './client';
import type { Ubicacion } from '../types';

export interface CreateUbicacionPayload {
    nombre: string;
    activa?: boolean;
    airbnb_ical_url?: string;
}

export const ubicacionesApi = {
    getAll: async (): Promise<Ubicacion[]> => {
        const { data } = await api.get('/ubicaciones');
        return data;
    },
    
    getById: async (id: string): Promise<Ubicacion> => {
        const { data } = await api.get(`/ubicaciones/${id}`);
        return data;
    },
    
    create: async (payload: CreateUbicacionPayload): Promise<Ubicacion> => {
        const { data } = await api.post('/ubicaciones', payload);
        return data;
    },
    
    update: async (id: string, payload: Partial<CreateUbicacionPayload>): Promise<Ubicacion> => {
        const { data } = await api.put(`/ubicaciones/${id}`, payload);
        return data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/ubicaciones/${id}`);
    }
};
