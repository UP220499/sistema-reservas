import api from './client';
import type {
    Reserva,
    PaginatedResponse,
    PagoMovimiento,
    Ubicacion,
    CatalogoItem,
} from '../types';

export type { Reserva };

export interface ReservationFilters {
    page?: number;
    page_size?: number;
    ubicacion_id?: string;
    cliente_id?: string;
    estatus_reserva_code?: string;
    from?: string;
    to?: string;
}

export interface CreateReservationPayload {
    cliente_id: string;
    ubicacion_id: string;
    origen_reserva_code: string;
    estatus_reserva_code?: string;
    checkin_datetime: string;
    checkout_datetime: string;
    total_reserva?: number;
    notas?: string;
}

export interface CreatePaymentPayload {
    tipo_pago_mov_code: string;
    metodo_pago_code: string;
    monto: number;
    fecha_pago: string;
    referencia?: string;
    notas?: string;
}

export const reservationsApi = {
    findAll: async (
        filters: ReservationFilters = {},
    ): Promise<PaginatedResponse<Reserva>> => {
        const { data } = await api.get('/reservations', { params: filters });
        return data;
    },

    findOne: async (id: string): Promise<Reserva> => {
        const { data } = await api.get(`/reservations/${id}`);
        return data;
    },

    create: async (payload: CreateReservationPayload): Promise<Reserva> => {
        const { data } = await api.post('/reservations', payload);
        return data;
    },

    update: async (
        id: string,
        payload: Partial<CreateReservationPayload>,
    ): Promise<Reserva> => {
        const { data } = await api.put(`/reservations/${id}`, payload);
        return data;
    },

    changeStatus: async (
        id: string,
        estatus_reserva_code: string,
    ): Promise<Reserva> => {
        const { data } = await api.patch(`/reservations/${id}/status`, {
            estatus_reserva_code,
        });
        return data;
    },

    // Payments nested under reservation
    getPayments: async (reservationId: string): Promise<PagoMovimiento[]> => {
        const { data } = await api.get(
            `/reservations/${reservationId}/payments`,
        );
        return data;
    },

    createPayment: async (
        reservationId: string,
        payload: CreatePaymentPayload,
    ): Promise<PagoMovimiento> => {
        const { data } = await api.post(
            `/reservations/${reservationId}/payments`,
            payload,
        );
        return data;
    },
};

// Catalogs & Locations (reusable)
export const catalogsApi = {
    getUbicaciones: async (): Promise<Ubicacion[]> => {
        const { data } = await api.get('/ubicaciones');
        return data;
    },

    getEstatusReserva: async (): Promise<CatalogoItem[]> => {
        return [
            { code: 'PENDIENTE', nombre: 'Pendiente' },
            { code: 'CONFIRMADA', nombre: 'Confirmada' },
            { code: 'CANCELADA', nombre: 'Cancelada' },
            { code: 'COMPLETADA', nombre: 'Completada' },
        ];
    },

    getOrigenReserva: async (): Promise<CatalogoItem[]> => {
        return [
            { code: 'DIRECTA', nombre: 'Directa' },
            { code: 'EXTERNA', nombre: 'Externa' },
        ];
    },

    getMetodosPago: async (): Promise<CatalogoItem[]> => {
        return [
            { code: 'EFECTIVO', nombre: 'Efectivo' },
            { code: 'TRANSFERENCIA', nombre: 'Transferencia' },
            { code: 'TARJETA', nombre: 'Tarjeta' },
        ];
    },

    getTiposPagoMov: async (): Promise<CatalogoItem[]> => {
        return [
            { code: 'ANTICIPO', nombre: 'Anticipo' },
            { code: 'LIQUIDACION', nombre: 'Liquidación' },
            { code: 'AJUSTE', nombre: 'Ajuste' },
        ];
    },
};
