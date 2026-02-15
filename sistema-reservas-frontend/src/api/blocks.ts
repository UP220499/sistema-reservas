import api from './client';
import type { Bloqueo, PaginatedResponse } from '../types';

export interface BlockFilters {
    page?: number;
    page_size?: number;
    ubicacion_id?: string;
    from?: string;
    to?: string;
    estatus_bloqueo?: string;
}

export interface CreateBlockPayload {
    ubicacion_id: string;
    origen_bloqueo_code: string;
    inicio_datetime: string;
    fin_datetime: string;
    estatus_bloqueo?: string;
    external_uid?: string;
}

export const blocksApi = {
    findAll: async (
        filters: BlockFilters = {},
    ): Promise<PaginatedResponse<Bloqueo>> => {
        const { data } = await api.get('/blocks', { params: filters });
        return data;
    },

    findOne: async (id: string): Promise<Bloqueo> => {
        const { data } = await api.get(`/blocks/${id}`);
        return data;
    },

    create: async (payload: CreateBlockPayload): Promise<Bloqueo> => {
        const { data } = await api.post('/blocks', payload);
        return data;
    },

    changeStatus: async (
        id: string,
        estatus_bloqueo: string,
    ): Promise<Bloqueo> => {
        const { data } = await api.patch(`/blocks/${id}/status`, {
            estatus_bloqueo,
        });
        return data;
    },
};
