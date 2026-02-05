-- Align Airbnb block uniqueness per location and UID
DROP INDEX IF EXISTS uq_bloqueo_ical_uid;

CREATE UNIQUE INDEX uq_bloqueo_ical_uid
ON public.bloqueo_calendario (ubicacion_id, origen_bloqueo_code, external_uid)
WHERE external_uid IS NOT NULL;
