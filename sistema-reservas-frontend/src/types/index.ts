export interface LoginRequest {
    username: string;
    password: string;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
}

export interface UserProfile {
    usuario_id: string;
    nombre: string;
    username: string;
    rol_code: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
    };
}

export interface Reserva {
    reserva_id: string;
    ubicacion_id: string;
    cliente_id: string;
    fecha_entrada: string;
    fecha_salida: string;
    num_huespedes: number;
    precio_total: string;
    notas: string | null;
    estatus_reserva_code: string;
    origen_reserva_code: string;
    created_at: string;
    updated_at: string;
    ubicacion?: { nombre: string };
    cliente?: { nombre: string; correo: string | null };
    estatus_reserva?: { nombre: string };
}

export interface Cliente {
    cliente_id: string;
    nombre: string;
    correo: string | null;
    activo: boolean;
    cliente_telefono?: ClienteTelefono[];
}

export interface ClienteTelefono {
    cliente_telefono_id: string;
    cliente_id: string;
    telefono: string;
    es_principal: boolean;
    activo: boolean;
}

export interface Ubicacion {
    ubicacion_id: string;
    nombre: string;
    activa: boolean;
}

export interface PagoMovimiento {
    pago_movimiento_id: string;
    reserva_id: string;
    monto: string;
    metodo_pago_code: string;
    tipo_pago_mov_code: string;
    fecha_pago: string;
    referencia: string | null;
    notas: string | null;
    created_at: string;
}

export interface Bloqueo {
    bloqueo_id: string;
    ubicacion_id: string;
    inicio_datetime: string;
    fin_datetime: string;
    estatus_bloqueo: string;
    origen_bloqueo_code: string;
    external_uid: string | null;
    ubicacion?: { nombre: string };
}

export interface CatalogoItem {
    code: string;
    nombre: string;
    activo?: boolean;
}

// Calendar discriminated union (mirrors backend CalendarEventResponse)
export type CalendarEvent =
    | {
        tipo: 'RESERVA';
        id: string;
        ubicacion_id: string;
        ubicacion_nombre: string;
        inicio_datetime: string;
        fin_datetime: string;
        estatus_reserva_code: string;
        origen_reserva_code: string;
        cliente_id: string;
        cliente_nombre: string;
    }
    | {
        tipo: 'BLOQUEO';
        id: string;
        ubicacion_id: string;
        ubicacion_nombre: string;
        inicio_datetime: string;
        fin_datetime: string;
        estatus_bloqueo: string;
        origen_bloqueo_code: string;
        external_uid: string | null;
    };

export interface CalendarResponse {
    items: CalendarEvent[];
    page: number;
    page_size: number;
    total: number;
}
