# Entorno de desarrollo local

Cómo levantar el stack completo (backend + frontend + Postgres con datos) en local.

## Requisitos
- Node 20+ y npm.
- Docker (para Postgres) o un Postgres local.

## 1. Base de datos (Postgres en Docker)
```bash
docker run -d --name vendora-pg \
  -e POSTGRES_PASSWORD=vendora -e POSTGRES_DB=vendora \
  -p 5433:5432 postgres:16
```
> Se usa el puerto host **5433** para no chocar con otros Postgres en 5432. Ajustá `DATABASE_URL` si usás otro.

## 2. Backend `.env`
Copiá `backend/.env.example` a `backend/.env` y completá (valores de ejemplo para local):
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:vendora@localhost:5433/vendora
FRONTEND_APP_URL=http://localhost:3001
ADMIN_SESSION_SECRET=local-dev-only-secret-change-me-32chars-min
ADMIN_INITIAL_EMAIL=admin@vendora.local
ADMIN_INITIAL_PASSWORD=admin1234
```

## 3. Schema + datos
```bash
cd backend
npm ci
npx prisma migrate deploy   # aplica las migraciones (0_init: schema completo + CHECKs)
npx prisma db seed          # datos de referencia: categorías, atributos, cupón

# (opcional) productos demo para desarrollo:
DATABASE_URL='postgresql://postgres:vendora@localhost:5433/vendora' \
  node prisma/seed-demo.cjs
```

> Las migraciones se baselinearon en una única `0_init` generada del schema actual
> (`prisma migrate diff --from-empty`), con los CHECK de inventario re-agregados a mano
> (Prisma no los expresa en el schema). Los datos de referencia se siembran con
> `prisma db seed` (`prisma/seed.cjs`), no desde migraciones.

## 4. Correr
```bash
# backend (puerto 3000)
cd backend && npm run start

# frontend (puerto 3001, apuntando al backend)
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api \
  ./node_modules/.bin/next dev -p 3001
```

Abrí:
- Tienda: http://localhost:3001
- Styleguide: http://localhost:3001/styleguide
- Admin: http://localhost:3001/admin (`admin@vendora.local` / `admin1234`)

## Datos demo sembrados
- **Categorías:** Electrónica › **Audio** (subcategoría), Hogar, Accesorios.
- **Atributos:** Color (Negro/Blanco/Azul), Material (Vidrio/Metal/Madera).
- **Cupón:** `BIENVENIDA10` → 10% off.
- **Productos:** 6 (Auriculares Aurora, Parlante Halo, Lámpara Solina, Mate Imperial,
  Mochila Trek, Botella de Vidrio). *Mochila Trek* queda con **0 stock** a propósito
  para probar la validación de stock en vivo.

## Bajar todo
```bash
# matar dev servers
lsof -ti tcp:3000 tcp:3001 | xargs kill -9
# parar/borrar Postgres
docker rm -f vendora-pg
```
