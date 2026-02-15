# Database Seeds

Archivos SQL para poblar la base de datos en un entorno nuevo. Ejecutar **en orden numérico** después de aplicar las migraciones de Prisma.

## Requisitos previos

```bash
npx prisma migrate deploy
```

## Ejecución

Ejecutar cada archivo en orden:

```bash
psql "$DATABASE_URL" -f sql/seeds/001_catalogos.sql
psql "$DATABASE_URL" -f sql/seeds/002_ubicaciones.sql
psql "$DATABASE_URL" -f sql/seeds/003_usuario_admin.sql
```

O todos de una vez:

```bash
for f in sql/seeds/0*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

## Archivos

| Archivo | Contenido |
|---|---|
| `001_catalogos.sql` | Catálogos: roles, estatus de pago/reserva, métodos de pago, orígenes |
| `002_ubicaciones.sql` | 12 ubicaciones (propiedades de renta) |
| `003_usuario_admin.sql` | Usuario admin inicial (requiere hash de contraseña) |

## Notas

- Todos los INSERTs usan `ON CONFLICT DO NOTHING`, por lo que son **idempotentes** (seguros de re-ejecutar).
- El archivo `003_usuario_admin.sql` tiene un **placeholder** para el hash de la contraseña. Para generar uno real:
  ```bash
  node -e "require('bcrypt').hash('TU_PASSWORD', 12).then(h => console.log(h))"
  ```
