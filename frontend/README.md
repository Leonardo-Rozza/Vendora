# Vendora — Frontend

Storefront y panel de administración de Vendora, construido con [Next.js](https://nextjs.org) (App Router) y React. La aplicación consume la API de backend de Vendora para el catálogo, el carrito, el checkout (con Mercado Pago), el seguimiento de pedidos y la gestión de productos/órdenes en el admin.

## Requisitos

- Node.js 20+
- npm

## Configuración

Copiá el archivo de ejemplo y ajustá las variables según tu entorno:

```bash
cp .env.example .env.local
```

### Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL base del backend de Vendora. Apunta al prefijo `/api`. Si no se define, por defecto usa `http://localhost:3000/api`. | `http://localhost:3000/api` |

## Desarrollo

Instalá dependencias y levantá el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador.

> Nota: si el backend corre en `http://localhost:3000`, levantá el frontend en otro puerto (por ejemplo `npm run dev -- -p 3001`) y apuntá `NEXT_PUBLIC_API_BASE_URL` al backend.

## Tests

Los tests usan [Vitest](https://vitest.dev):

```bash
npm test          # corre la suite una vez
npm run test:watch  # modo watch
npm run test:cov    # con cobertura
```

## Scripts disponibles

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm start` — sirve el build de producción
- `npm run lint` — ESLint
- `npm test` — suite de tests (Vitest)

## Estructura

- `app/` — rutas del App Router (storefront, carrito, checkout, seguimiento, admin)
- `components/` — componentes de UI (catálogo, carrito, admin, commerce provider)
- `lib/commerce/` — cliente de API, esquemas de validación (Zod) y lógica de catálogo/checkout
- `lib/contracts.ts` — tipos compartidos de las respuestas de la API
- `lib/copy/` — textos en español (es-AR)
- `test/` — tests de Vitest
