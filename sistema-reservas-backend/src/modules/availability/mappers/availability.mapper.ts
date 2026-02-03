import {
  BlockConflictRecord,
  ReservationConflictRecord,
} from '../prisma/availability.repository';

export type AvailabilityConflict =
  | {
      tipo: 'RESERVA';
      id: string;
      inicio_datetime: string;
      fin_datetime: string;
      estatus_reserva_code: string;
      origen_reserva_code: string;
    }
  | {
      tipo: 'BLOQUEO';
      id: string;
      inicio_datetime: string;
      fin_datetime: string;
      estatus_bloqueo: string;
      origen_bloqueo_code: string;
    };

export interface AvailabilityResponse {
  ubicacion_id: string;
  from: string;
  to: string;
  disponible: boolean;
  conflicts: AvailabilityConflict[];
}

export class AvailabilityMapper {
  static fromReservation(
    record: ReservationConflictRecord,
  ): AvailabilityConflict {
    return {
      tipo: 'RESERVA',
      id: record.reserva_id.toString(),
      inicio_datetime: record.checkin_datetime.toISOString(),
      fin_datetime: record.checkout_datetime.toISOString(),
      estatus_reserva_code: record.estatus_reserva_code,
      origen_reserva_code: record.origen_reserva_code,
    };
  }

  static fromBlock(record: BlockConflictRecord): AvailabilityConflict {
    return {
      tipo: 'BLOQUEO',
      id: record.bloqueo_id.toString(),
      inicio_datetime: record.inicio_datetime.toISOString(),
      fin_datetime: record.fin_datetime.toISOString(),
      estatus_bloqueo: record.estatus_bloqueo,
      origen_bloqueo_code: record.origen_bloqueo_code,
    };
  }

  static buildResponse(
    ubicacionId: bigint,
    from: Date,
    to: Date,
    conflicts: AvailabilityConflict[],
  ): AvailabilityResponse {
    return {
      ubicacion_id: ubicacionId.toString(),
      from: from.toISOString(),
      to: to.toISOString(),
      disponible: conflicts.length === 0,
      conflicts,
    };
  }
}
