-- =============================================
-- Seed: Ubicaciones (propiedades de renta)
-- =============================================

INSERT INTO ubicacion (ubicacion_id, nombre, activa) VALUES
  (2,  'Puerta Norte 106',  true),
  (3,  'Casa JM',           true),
  (4,  'Departamento 4',    true),
  (5,  'Departamento 5',    true),
  (6,  'Departamento 6',    true),
  (7,  'Departamento 7',    false),
  (8,  'Tule 121',          true),
  (9,  'Tule 222',          true),
  (10, 'Punta 1',           true),
  (11, 'Punta 4',           true),
  (12, 'Punta 3',           true),
  (13, 'San Antonio 99',    true)
ON CONFLICT (ubicacion_id) DO NOTHING;

-- Resetear la secuencia al valor correcto
SELECT setval('ubicacion_ubicacion_id_seq', (SELECT MAX(ubicacion_id) FROM ubicacion));
