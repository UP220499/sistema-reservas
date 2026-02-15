-- =============================================
-- Seed: Usuario administrador inicial
-- Password: Admin2026! (bcrypt, 12 rounds)
-- IMPORTANTE: Cambiar la contraseña después del
-- primer login en producción.
-- =============================================

INSERT INTO usuario (usuario_id, rol_code, nombre, username, password_hash, activo)
VALUES (
  2,
  'ADMIN',
  'Yessica Tovar',
  'yessica.tovar',
  '$2b$12$placeholder_hash_run_seed_password_script',
  true
)
ON CONFLICT (usuario_id) DO NOTHING;

-- Resetear la secuencia al valor correcto
SELECT setval('usuario_usuario_id_seq', (SELECT MAX(usuario_id) FROM usuario));

-- NOTA: Para generar un hash válido, ejecuta:
--   node -e "require('bcrypt').hash('Admin2026!', 12).then(h => console.log(h))"
-- Y reemplaza el placeholder_hash en este archivo, o ejecuta:
--   node scripts/seed-password.js
