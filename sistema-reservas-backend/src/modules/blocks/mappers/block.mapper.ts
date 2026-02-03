import { bloqueo_calendario } from '@prisma/client';

export interface BlockResponse {
  bloqueo_id: string;
  ubicacion_id: string;
  origen_bloqueo_code: string;
  inicio_datetime: string;
  fin_datetime: string;
  estatus_bloqueo: string;
  external_uid: string | null;
  raw_payload: string | null;
  created_at: string;
  updated_at: string | null;
}

export class BlockMapper {
  static toResponse(block: bloqueo_calendario): BlockResponse {
    return {
      bloqueo_id: block.bloqueo_id.toString(),
      ubicacion_id: block.ubicacion_id.toString(),
      origen_bloqueo_code: block.origen_bloqueo_code,
      inicio_datetime: block.inicio_datetime.toISOString(),
      fin_datetime: block.fin_datetime.toISOString(),
      estatus_bloqueo: block.estatus_bloqueo,
      external_uid: block.external_uid ?? null,
      raw_payload: block.raw_payload ?? null,
      created_at: block.created_at.toISOString(),
      updated_at: block.updated_at ? block.updated_at.toISOString() : null,
    };
  }
}
