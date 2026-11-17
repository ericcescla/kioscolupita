# Kiosco Lupita

Aplicación web para consultar, cargar y actualizar precios de productos. Está dividida en `backend/` (Node.js, Express, TypeScript, Sequelize y PostgreSQL) y `frontend/` (React, TypeScript y Vite).

## Requisitos

- Node.js 20 o superior y npm.
- PostgreSQL 14 o superior.

## Preparar la base de datos

1. Crear una base PostgreSQL vacía, por ejemplo `kiosco_lupita`.
2. Copiar `backend/.env.example` a `backend/.env` y definir `DATABASE_URL` con usuario, contraseña, host, puerto y base correctos. Ejemplo: `postgres://postgres:clave@localhost:5432/kiosco_lupita`.
3. Opcionalmente cambiar `DB_SSL` y `PORT`.

4. Ejecutar `npm run db:migrate --prefix backend` para crear la tabla `productos`. El backend no modifica el esquema al arrancar; las migraciones SQL son explícitas y versionadas. El script de reversión es `backend/migrations/001-create-productos.down.sql`.

## Ejecutar en desarrollo

Desde esta carpeta ejecutar `npm install`, `npm install --prefix backend` y `npm install --prefix frontend`. Crear `frontend/.env` desde `frontend/.env.example` y definir `BACKEND_URL` con la URL de la API. Ejecutar `npm run dev` desde la raíz. Para revertir la migración: `npm run db:migrate:undo --prefix backend`.

Endpoints: `GET /api/health`, `GET /api/productos`, `GET /api/productos/:id`, `POST /api/productos`, `PUT /api/productos/:id` y `DELETE /api/productos/:id`. La API está abierta para facilitar el uso inicial; antes de exponerla públicamente, añadir autenticación y autorización a las rutas de escritura.
