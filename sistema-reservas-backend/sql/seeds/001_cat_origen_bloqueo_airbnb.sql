INSERT INTO cat_origen_bloqueo (origen_bloqueo_code, nombre, activo)
VALUES ('AIRBNB', 'Airbnb iCal', true)
ON CONFLICT (origen_bloqueo_code) DO NOTHING;
