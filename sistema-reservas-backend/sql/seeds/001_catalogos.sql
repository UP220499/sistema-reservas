-- =============================================
-- Seed: Catálogos del Sistema de Reservas
-- Ejecutar después de prisma migrate deploy
-- =============================================

-- Roles
INSERT INTO cat_rol (rol_code, nombre, activo) VALUES
  ('ADMIN',    'Administrador', true),
  ('OPERADOR', 'Operador',      true)
ON CONFLICT (rol_code) DO NOTHING;

-- Estatus de Pago
INSERT INTO cat_estatus_pago (estatus_pago_code, nombre, activo) VALUES
  ('PENDIENTE', 'Pendiente', true),
  ('PARCIAL',   'Parcial',   true),
  ('PAGADO',    'Pagado',    true),
  ('VENCIDO',   'Vencido',   true)
ON CONFLICT (estatus_pago_code) DO NOTHING;

-- Estatus de Reserva
INSERT INTO cat_estatus_reserva (estatus_reserva_code, nombre, bloquea_disponibilidad) VALUES
  ('BORRADOR',   'Borrador',   false),
  ('CONFIRMADA', 'Confirmada', true),
  ('EN_CURSO',   'En curso',   true),
  ('FINALIZADA', 'Finalizada', false),
  ('CANCELADA',  'Cancelada',  false)
ON CONFLICT (estatus_reserva_code) DO NOTHING;

-- Métodos de Pago
INSERT INTO cat_metodo_pago (metodo_pago_code, nombre, activo) VALUES
  ('EFECTIVO',      'Efectivo',      true),
  ('TRANSFERENCIA', 'Transferencia', true),
  ('TARJETA',       'Tarjeta',       true)
ON CONFLICT (metodo_pago_code) DO NOTHING;

-- Origen de Bloqueo
INSERT INTO cat_origen_bloqueo (origen_bloqueo_code, nombre, activo) VALUES
  ('AIRBNB_ICAL', 'Airbnb iCal', true),
  ('MANUAL',      'Manual',      true),
  ('AIRBNB',      'Airbnb iCal', true)
ON CONFLICT (origen_bloqueo_code) DO NOTHING;

-- Origen de Reserva
INSERT INTO cat_origen_reserva (origen_reserva_code, nombre, activo) VALUES
  ('EXTERNA', 'Externa', true)
ON CONFLICT (origen_reserva_code) DO NOTHING;

-- Tipo de Movimiento de Pago
INSERT INTO cat_tipo_pago_mov (tipo_pago_mov_code, nombre, activo) VALUES
  ('ANTICIPO',    'Anticipo',    true),
  ('LIQUIDACION', 'Liquidación', true),
  ('AJUSTE',      'Ajuste',      true)
ON CONFLICT (tipo_pago_mov_code) DO NOTHING;
