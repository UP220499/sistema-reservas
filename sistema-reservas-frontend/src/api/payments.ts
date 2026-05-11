import apiClient from './client';
import type { PagoMovimiento, PaginatedResponse } from '../types';

export interface GetPaymentsParams {
    page?: number;
    page_size?: number;
    reserva_id?: string;
    tipo_pago_mov_code?: string;
    metodo_pago_code?: string;
    ubicacion_id?: string;
    cliente_id?: string;
    from?: string;
    to?: string;
}

export const paymentsApi = {
    getAll: async (params: GetPaymentsParams = {}) => {
        const response = await apiClient.get<PaginatedResponse<PagoMovimiento>>('/payments', {
            params,
        });
        return response.data;
    },

    downloadPdf: async (paymentId: string) => {
        const response = await apiClient.get(`/payments/${paymentId}/pdf`, {
            responseType: 'blob',
        });
        
        // Extract filename from headers if possible
        const contentDisposition = response.headers['content-disposition'];
        let filename = `recibo-${paymentId}.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            if (filenameMatch && filenameMatch.length === 2) {
                filename = filenameMatch[1];
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        link.remove();
    },
};
