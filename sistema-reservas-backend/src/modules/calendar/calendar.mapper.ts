export type CalendarEventResponse =
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
      estatus_bloqueo?: undefined;
      origen_bloqueo_code?: undefined;
      external_uid?: undefined;
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
      estatus_reserva_code?: undefined;
      origen_reserva_code?: undefined;
      cliente_id?: undefined;
      cliente_nombre?: undefined;
    };

export interface ReservationEventRaw {
  reserva_id: bigint;
  ubicacion_id: bigint;
  checkin_datetime: Date;
  checkout_datetime: Date;
  estatus_reserva_code: string;
  origen_reserva_code: string;
  cliente: {
    cliente_id: bigint;
    nombre: string;
  };
  ubicacion: {
    ubicacion_id: bigint;
    nombre: string;
  };
}

export interface BlockEventRaw {
  bloqueo_id: bigint;
  ubicacion_id: bigint;
  inicio_datetime: Date;
  fin_datetime: Date;
  estatus_bloqueo: string;
  origen_bloqueo_code: string;
  external_uid: string | null;
  ubicacion: {
    ubicacion_id: bigint;
    nombre: string;
  };
}

export function mapReservationEvent(
  event: ReservationEventRaw,
): CalendarEventResponse {
  return {
    tipo: 'RESERVA',
    id: event.reserva_id.toString(),
    ubicacion_id: event.ubicacion_id.toString(),
    ubicacion_nombre: event.ubicacion.nombre,
    inicio_datetime: event.checkin_datetime.toISOString(),
    fin_datetime: event.checkout_datetime.toISOString(),
    estatus_reserva_code: event.estatus_reserva_code,
    origen_reserva_code: event.origen_reserva_code,
    cliente_id: event.cliente.cliente_id.toString(),
    cliente_nombre: event.cliente.nombre,
  };
}

export function mapBlockEvent(event: BlockEventRaw): CalendarEventResponse {
  return {
    tipo: 'BLOQUEO',
    id: event.bloqueo_id.toString(),
    ubicacion_id: event.ubicacion_id.toString(),
    ubicacion_nombre: event.ubicacion.nombre,
    inicio_datetime: event.inicio_datetime.toISOString(),
    fin_datetime: event.fin_datetime.toISOString(),
    estatus_bloqueo: event.estatus_bloqueo,
    origen_bloqueo_code: event.origen_bloqueo_code,
    external_uid: event.external_uid,
  };
}
