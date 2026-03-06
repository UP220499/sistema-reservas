# Sistema de Reservas Cielito Home

Sistema interno de gestión de reservas para propiedades de alojamiento tipo Airbnb. Resuelve el problema de administrar reservaciones, clientes, disponibilidad y pagos desde un único panel web, eliminando la dependencia de hojas de cálculo o herramientas externas para el seguimiento operativo.

---

## Características principales

- **Gestión de clientes** — registro, búsqueda, activación/desactivación y sistema de loyalty basado en monto acumulado de reservas
- **Gestión de reservaciones** — creación, edición de horarios, cambio de estado y auditoría de eventos
- **Control de disponibilidad** — validación automática de traslapes para prevenir reservas duplicadas
- **Bloqueos** — bloqueos manuales desde el panel y bloqueos sincronizados automáticamente desde Airbnb vía iCal
- **Registro de pagos** — pagos parciales o totales ligados a una reservación, con validación de montos
- **Dashboard operativo** — métricas de ocupación, ingresos y estadísticas del periodo
- **Integración iCal con Airbnb** — sincronización automática del calendario de Airbnb para reflejar disponibilidad real
- **Validación de reglas de negocio** — horarios por defecto, restricciones de traslape, límites de pago y condiciones de desactivación de clientes

---

## Arquitectura general

El sistema está dividido en dos aplicaciones independientes que se comunican vía API REST.

### Frontend

Aplicación SPA construida con React. Consume la API del backend mediante React Query para manejo de estado servidor. La interfaz utiliza un layout fijo con sidebar de navegación y header, organizada por módulos (Clientes, Reservaciones, Bloqueos, Dashboard).

### Backend

API REST construida con NestJS. Gestiona autenticación, validaciones de negocio, sincronización iCal y exposición de datos al frontend. Usa Prisma como ORM para interactuar con la base de datos.

### Base de datos

PostgreSQL con un modelo relacional normalizado. Incluye restricciones a nivel de base de datos para prevenir traslapes de reservaciones y garantizar integridad referencial.

---

## Stack tecnológico

### Frontend

| Tecnología | Uso |
|---|---|
| React 19 | Framework de UI |
| TypeScript 5 | Tipado estático |
| Vite 7 | Bundler y dev server |
| Material UI (MUI) v7 | Componentes de interfaz |
| React Query v5 (@tanstack/react-query) | Fetching y caché de datos |
| React Router v7 | Navegación SPA |
| Recharts | Gráficas del dashboard |
| Axios | Cliente HTTP |
| Day.js | Manipulación de fechas |

### Backend

| Tecnología | Uso |
|---|---|
| NestJS 11 | Framework de servidor |
| Node.js | Runtime |
| Prisma 6 | ORM y migraciones |
| Passport / JWT | Autenticación |

### Base de datos

| Tecnología | Uso |
|---|---|
| PostgreSQL | Base de datos relacional |

### Integraciones externas

| Integración | Uso |
|---|---|
| Airbnb iCal | Sincronización de bloqueos desde calendario de Airbnb |

---

## Estructura del proyecto

```
sistema-reservas/
├── sistema-reservas-frontend/
└── sistema-reservas-backend/
```

### Frontend — `sistema-reservas-frontend/src/`

```
src/
├── pages/          # Vistas por módulo (Login, Dashboard, Clients, Reservations, Blocks, Calendar)
├── components/     # Componentes reutilizables (ConfirmDialog, EmptyState, ToastProvider, etc.)
├── context/        # Contextos de React (AuthContext, ToastContext)
├── hooks/          # Hooks personalizados (useAuth, useToast)
├── api/            # Funciones de llamadas HTTP organizadas por módulo
├── auth/           # Lógica de autenticación y rutas protegidas
├── theme/          # Configuración del tema MUI
├── types/          # Tipos TypeScript del dominio
└── utils/          # Utilidades generales
```

### Backend — `sistema-reservas-backend/src/`

```
src/
├── modules/        # Módulos de dominio (auth, clients, reservations, blocks, payments, reports, ical_sync, availability, calendar, ubicaciones)
├── common/         # Guards, filtros y decoradores compartidos
├── prisma/         # Servicio y módulo de Prisma
├── app.module.ts   # Módulo raíz
└── main.ts         # Entry point
```

Cada módulo de dominio contiene su propio controller, service y DTOs.

---

## Ejecución en entorno local

### Requisitos previos

- Node.js 18+
- PostgreSQL 14+
- npm

### Backend

```bash
# 1. Instalar dependencias
cd sistema-reservas-backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correspondientes

# 3. Ejecutar migraciones
npx prisma migrate dev

# 4. Iniciar el servidor
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`.

### Frontend

```bash
# 1. Instalar dependencias
cd sistema-reservas-frontend
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de entorno

El backend requiere un archivo `.env` en la raíz del proyecto con las siguientes variables:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Formato: `postgresql://user:password@host:port/dbname` |
| `JWT_SECRET` | Clave secreta utilizada para firmar y verificar tokens JWT |
| `AIRBNB_ICAL_URL_<id_ubicacion>` | URL del calendario iCal de Airbnb para cada propiedad. Se usa para sincronizar bloqueos automáticamente |

---

## Reglas de negocio importantes

- **Horario por defecto:** check-in a las 3:00 PM, check-out a las 11:00 AM
- **Sin traslapes:** no se permiten dos reservaciones o bloqueos activos que se superpongan en el mismo periodo
- **Desactivación de clientes:** no se puede desactivar un cliente que tenga reservaciones activas
- **Edición de horarios:** solo las reservaciones en estado activo permiten modificar check-in y check-out
- **Bloqueos diferenciados:** los bloqueos manuales se crean desde el panel; los bloqueos de Airbnb se sincronizan vía iCal y se tratan como entidades separadas
- **Validación de pagos:** los montos no pueden ser negativos ni exceder el saldo pendiente de la reservación

---

## Estado actual del proyecto

El sistema está completamente funcional e incluye:

- Autenticación con JWT
- Dashboard con métricas operativas (ocupación, ingresos, estadísticas)
- Gestión completa de reservaciones (creación, edición, cambio de estado, historial)
- Gestión de clientes con sistema de loyalty
- Registro de pagos parciales y totales
- Bloqueos manuales y sincronización automática con Airbnb vía iCal
- Interfaz web con diseño premium y experiencia de usuario refinada

---

## Buenas prácticas del proyecto

- **Ramas por feature/fix/docs** — cada cambio vive en su propia rama antes de integrarse a `main`
- **API en snake_case** — todos los campos del contrato REST siguen nomenclatura snake_case
- **Lint y build en verde** — el código debe pasar `eslint` y compilar sin errores antes de mergearse
- **Separación frontend/backend** — cada aplicación es un proyecto independiente con su propio ciclo de vida
