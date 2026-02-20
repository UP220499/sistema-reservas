import api from './client';
import type { Cliente, PaginatedResponse } from '../types';

export type Client = Cliente;

export interface ClientFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    active?: boolean;
}

export interface CreateClientPayload {
    nombre: string;
    correo?: string | null;
    phones: { telefono: string; es_principal: boolean }[];
}

export interface UpdateClientPayload {
    nombre?: string;
    correo?: string | null;
}

export interface AddPhonePayload {
    telefono: string;
    es_principal?: boolean;
}

export const clientsApi = {
    findAll: async (
        filters: ClientFilters = {},
    ): Promise<PaginatedResponse<Cliente>> => {
        const { data } = await api.get('/clients', { params: filters });
        return data;
    },

    findOne: async (id: string): Promise<Cliente> => {
        const { data } = await api.get(`/clients/${id}`);
        return data;
    },

    create: async (payload: CreateClientPayload): Promise<Cliente> => {
        const { data } = await api.post('/clients', payload);
        return data;
    },

    update: async (
        id: string,
        payload: UpdateClientPayload,
    ): Promise<Cliente> => {
        const { data } = await api.put(`/clients/${id}`, payload);
        return data;
    },

    changeStatus: async (id: string, active: boolean): Promise<Cliente> => {
        const { data } = await api.patch(`/clients/${id}/status`, { active });
        return data;
    },

    addPhone: async (
        clientId: string,
        payload: AddPhonePayload,
    ): Promise<void> => {
        await api.post(`/clients/${clientId}/phones`, payload);
    },

    updatePhone: async (
        clientId: string,
        phoneId: string,
        payload: Partial<AddPhonePayload> & { activo?: boolean },
    ): Promise<void> => {
        await api.patch(`/clients/${clientId}/phones/${phoneId}`, payload);
    },

    setPrimaryPhone: async (
        clientId: string,
        phoneId: string,
    ): Promise<void> => {
        await api.put(`/clients/${clientId}/phones/${phoneId}/primary`);
    },
};
