# Vendora — Temario del proyecto

Guía de estudio para entender **todo lo que usa Vendora** y **cómo fluye** una compra de
punta a punta. Está pensada para ir leyéndola de arriba hacia abajo: cada tema explica
*qué es*, *dónde se usa en el proyecto* y *qué archivos mirar*.

> Convención: las rutas son relativas a la raíz del repo (`backend/` o `frontend/`).

---

## 0. Mapa general (la foto grande)

Vendora es una **tienda + backoffice** dividida en dos apps:

```
┌─────────────────────┐        HTTP/JSON         ┌──────────────────────┐
│   FRONTEND (Vercel) │  ───────────────────────▶ │   BACKEND (Railway)  │
│   Next.js + React   │   NEXT_PUBLIC_API_BASE_URL │   NestJS + Prisma    │
│   (tienda + admin)  │ ◀─────────────────────────│   (API REST)         │
└─────────────────────┘                           └──────────┬───────────┘
                                                              │
                        ┌─────────────────────────────────────┼─────────────┐
                        ▼                  ▼                   ▼             ▼
                  PostgreSQL         Mercado Pago         Cloudinary       Resend
                  (datos)            (pagos)              (imágenes)       (emails)
```

- **Frontend**: catálogo, producto, carrito, checkout, seguimiento y panel admin.
- **Backend**: API REST que maneja catálogo, órdenes, pagos, inventario, cupones y notificaciones.
- **Servicios externos**: PostgreSQL (base), Mercado Pago (cobros), Cloudinary (imágenes), Resend (mails).

---

## 1. Backend — NestJS

### 1.1 NestJS: módulos, controllers, services, providers
Framework Node con arquitectura modular e **inyección de dependencias** (DI).
- **Module**: agrupa funcionalidad (`@Module`). Ver `backend/src/domains/*/*.module.ts`.
- **Controller**: define rutas HTTP (`@Controller`, `@Get`, `@Post`). Ej: `domains/catalog/catalog.controller.ts`.
- **Service**: la lógica de negocio (`@Injectable`). Ej: `domains/orders/orders.service.ts`.
- **Provider/DI**: Nest inyecta services en controllers por constructor.
- **Organización por dominios**: `domains/` (catalog, orders, payments, inventory, coupons, notifications, auth) + `platform/` (config, prisma, logging, providers, media).

### 1.2 Prisma + PostgreSQL (ORM)
- **Schema** (`backend/prisma/schema.prisma`): define los 16 modelos (Product, Variant, Order, Payment, Coupon, etc.) y sus relaciones.
- **Prisma Client**: cliente tipado autogenerado (`prisma generate`) que usás como `this.prisma.order.findMany(...)`.
- **Migraciones** (`prisma/migrations/`): SQL versionado. Acá están aplastadas en un solo `0_init`.
- **Seeds**: `prisma/seed.cjs` (datos base idempotentes con `upsert`) y `prisma/seed-demo.cjs` (demo).
- **Config**: `prisma.config.ts` (reemplaza el bloque deprecado `package.json#prisma`).
- Conceptos a estudiar: relaciones, `include`, transacciones (`$transaction`), `Decimal` para plata.

### 1.3 Validación de entrada: DTOs + class-validator
- **DTO** = Data Transfer Object: describe y valida el body/query de cada request.
- `class-validator` (`@IsString`, `@IsInt`, etc.) + `ValidationPipe` global rechazan datos inválidos antes de llegar al service. Ver `domains/*/dto/*.ts`.

### 1.4 Autenticación admin (sesión por cookie firmada)
- Login admin → cookie **firmada con HMAC** usando `ADMIN_SESSION_SECRET`. No usa JWT de terceros.
- **Guard** `AdminSessionGuard` (`domains/auth/guards/`) protege las rutas `/admin/*`.
- Importante: la auth **no toca la base** (valida la firma de la cookie), por eso el login anda aunque la DB esté vacía.
- Conceptos: Guards de Nest, HMAC, cookies `httpOnly`/`sameSite`.

### 1.5 Seguridad (hardening)
- **Rate limiting**: `@nestjs/throttler` limita requests por IP (anti fuerza bruta/abuso).
- **Helmet + CSP**: cabeceras de seguridad. La CSP también está en el front (`next.config.ts`).
- **CORS allowlist**: orígenes permitidos por env (`FRONTEND_APP_URL`), no wildcard.
- **CSRF**: defendido por chequeo de `Origin` (porque la cookie es `sameSite=none` cross-site).
- **Redacción de PII en logs**: no se loguean datos sensibles de webhooks.
- Ver `platform/` (logging, config) y la memoria `security-first`.

### 1.6 Configuración y validación de entorno
- `@nestjs/config` carga variables; `platform/config/env.validation.ts` las **valida al arrancar** (si falta algo crítico en prod, no levanta — es a propósito).
- `platform/config/app-config.service.ts` expone getters tipados (ej. `orderPendingTtlMinutes`).
- Patrón clave: *capabilities* — Mercado Pago, Cloudinary y email son "opcionales juntos"; si no están configurados, esa capacidad se apaga.

### 1.7 Integración Mercado Pago (Checkout Pro)
- **Preferencia de pago**: el backend crea una "preference" en MP y devuelve el `initPoint` (URL de pago). Ver `domains/payments/payments.service.ts` → `createCheckoutPreference`.
- **Webhook**: MP notifica el resultado a `/api/payments/webhooks/mercado-pago`.
  - Se **verifica la firma** (`x-signature`) antes de procesar — un webhook no firmado se rechaza.
  - El estado **autoritativo** se consulta a MP (nunca se confía en el body).
  - Es **idempotente** (deduplica por `eventId`) y maneja transiciones de estado.
- Conceptos: webhooks, firma/HMAC, idempotencia, máquina de estados de pago.

### 1.8 Inventario: reserva de stock
- Al crear la orden se **reserva** stock (`reserveItems`); al pagar se **consume** (`consumeReservationForOrder`); si se cancela/expira se **libera** (`releaseReservationForOrder`). Ver `domains/inventory/inventory.service.ts`.
- **Concurrencia**: las operaciones son atómicas (no permiten que el disponible baje del reservado).
- **Expiración**: un cron (`order-expiration.service.ts`) cancela órdenes pendientes vencidas y libera su stock (TTL `ORDER_PENDING_TTL_MINUTES`).

### 1.9 Cupones / descuentos
- Validación de cupón (`domains/coupons`) y **redención atómica** para evitar usar uno vencido o de más. Tipos PERCENTAGE/FIXED.

### 1.10 Órdenes, hitos y seguimiento
- Una `Order` tiene `OrderMilestone[]` (creada, pago confirmado, en reparto, entregada…) → es el **timeline de seguimiento**.
- Token de seguimiento público (`/orders/tracking/:token`) que el cliente usa sin login.
- Estados de **fulfillment** que el admin va avanzando. Ver `domains/orders/order-tracking.mapper.ts`.

### 1.11 Notificaciones por email
- `domains/notifications`: al cumplirse ciertos hitos (pago confirmado, en reparto, entregado) se manda un mail.
- Proveedor **compatible con Resend** (POST a `/emails`). Idempotente (`NotificationDelivery`) y *best-effort* (si falla, no rompe el pago).
- Template HTML con la marca en `notifications.service.ts`.

### 1.12 Tareas programadas (cron)
- `@nestjs/schedule` con `@Cron`. Se usa para la expiración de órdenes (1.8). Registrado condicionalmente (no corre en tests).

### 1.13 Subida de imágenes (Cloudinary, firma)
- El backend **firma** la subida (`platform/media` + `platform/providers/cloudinary`) y el front sube el archivo directo a Cloudinary con esa firma. Así la API secret nunca toca el browser.
- Conceptos: signed upload, separación de secretos.

---

## 2. Frontend — Next.js + React

### 2.1 Next.js App Router (RSC)
- **App Router** (`frontend/app/`): cada carpeta es una ruta; `page.tsx` es la página, `layout.tsx` el layout.
- **Server Components (RSC)** por defecto: corren en el servidor, hacen fetch sin exponer lógica al cliente (ej. el catálogo y el producto).
- **Client Components** (`"use client"`): interactividad/estado (carrito, formularios, admin).
- Conceptos: `generateMetadata`, `notFound()`, `force-dynamic`, `cache()`.

### 2.2 Archivos especiales de ruta
- `loading.tsx` → skeleton mientras el server hace fetch (Suspense).
- `error.tsx` → error boundary por ruta; `global-error.tsx` → captura fallos del layout raíz.
- `not-found.tsx` → 404 con marca.
- Ver `app/error.tsx`, `app/loading.tsx`, `app/products/[slug]/`, `app/seguimiento/[token]/`.

### 2.3 React: estado, hooks, context
- `useState`/`useEffect`/`useMemo`/`useCallback`.
- **Context** para el carrito global: `components/commerce/commerce-provider.tsx` (`useCommerce`).
- `useSyncExternalStore` para hidratar el carrito desde `localStorage` sin desajustes SSR/cliente.

### 2.4 Tailwind CSS v4 + sistema de diseño
- **Tailwind v4** es "CSS-first": los tokens se definen en `app/globals.css` con `@theme` (colores `--color-*`, radios, sombras, fuentes).
- **Design tokens**: paleta (surface/ink/brand/line), `rounded-field/card/panel`, `shadow-*`.
- **Librería de componentes** en `components/ui/*` (Button, Card, Badge, Field, Input, Pagination, Dialog…). Hay una guía visual en `/styleguide`.
- Los `.dc.html` en `docs/design/` son la fuente del diseño (export de Claude Design).

### 2.5 Fuentes (next/font)
- `next/font/google` (Hanken Grotesk + Space Mono) autohospedadas: sin requests externos (mejor performance y compatible con CSP). Ver `app/layout.tsx`.

### 2.6 Capa de datos / contratos
- `lib/commerce/api.ts`: todas las llamadas al backend (fetch tipado, manejo de errores con `ApiError`).
- `lib/contracts.ts`: tipos TS de las respuestas. `lib/commerce/schemas.ts`: validación en el borde (estilo Zod) de lo que llega del backend.
- `lib/commerce/cart.ts` y `checkout.ts`: lógica pura (totales, validación AMBA, mapeo a `createOrder`). **Acá viven los tests** más importantes.

### 2.7 Validación de formularios
- Checkout y admin validan en cliente antes de enviar (campos requeridos, zona AMBA, stock). Mensajes accesibles con `role="alert"`.

### 2.8 SEO
- `app/sitemap.ts` (URLs dinámicas), `app/robots.ts` (bloquea admin/checkout/seguimiento), **Open Graph/Twitter** en metadata, y **JSON-LD** (`schema.org/Product`) en la página de producto.
- `NEXT_PUBLIC_SITE_URL` define la URL absoluta. Ver `lib/seo/site.ts`.

### 2.9 Optimización de imágenes
- `next/image` (con `remotePatterns` para Cloudinary en `next.config.ts`): lazy-load, tamaños responsive, formato moderno.

### 2.10 Accesibilidad (a11y)
- Labels asociados (htmlFor/id), `role="alert"`, `aria-*`, foco visible, `sr-only` para texto solo-lector.
- ESLint con `eslint-plugin-jsx-a11y` (`label-has-associated-control` como fuente de verdad). Ver `eslint.config.mjs`.

---

## 3. Temas transversales

### 3.1 TypeScript
- Tipado estático en todo el stack. `tsc --noEmit` valida sin compilar. Tipos compartidos vía contratos.

### 3.2 Testing
- **Backend**: Jest (unit + e2e). ~95 tests. Ver `backend/src/**/*.spec.ts`.
- **Frontend**: Vitest + Testing Library. ~86 tests. Ver `frontend/test/*`.
- Patrones: unit de funciones puras (cart/checkout), render tests de componentes, mock de `fetch`/módulos con `vi.mock`.

### 3.3 Calidad: ESLint + Prettier
- Lint en ambos proyectos; el front quedó en 0 warnings. Formato consistente.

### 3.4 CI (GitHub Actions)
- `.github/workflows/ci.yml`: corre lint + typecheck + test + build en backend y frontend en cada push/PR, más un audit de dependencias (informativo).

### 3.5 Git (flujo de trabajo)
- Commits chicos y descriptivos, ramas, merges a `main`. PRs cuando corresponde.

### 3.6 Deployment
- **Backend → Railway** (Nixpacks): build + `prisma migrate deploy && node dist/main`. Ver `backend/railway.json` y la memoria `railway-deploy`.
- **Frontend → Vercel**: build de Next.js, deploy automático por push.
- **DB → PostgreSQL** en Railway (referencia interna `${{Postgres.DATABASE_URL}}`).

---

## 4. El flujo de una compra (poné todo junto)

```
1. Cliente navega el CATÁLOGO            → app/page.tsx (RSC) → GET /api/catalog/products
2. Abre un PRODUCTO                       → app/products/[slug] → GET /api/catalog/products/:slug
3. Agrega al CARRITO                      → commerce-provider (client) → localStorage
4. Va al CHECKOUT, valida datos+AMBA      → lib/commerce/checkout.ts
5. Crea la ORDEN                          → POST /api/orders  (reserva stock)
6. Se crea la PREFERENCIA de pago         → POST /api/payments/checkout-preferences
7. Paga en MERCADO PAGO                   → initPoint (redirect)
8. MP envía el WEBHOOK (firmado)          → POST /api/payments/webhooks/mercado-pago
9. Backend confirma: consume stock,
   marca PAID, crea hito, manda EMAIL     → payments.service.ts + notifications
10. Cliente ve el SEGUIMIENTO             → app/seguimiento/[token] → GET /api/orders/tracking/:token
11. Admin avanza el FULFILLMENT           → cada paso manda email
(si no se paga a tiempo → el CRON expira la orden y libera el stock)
```

---

## 5. Ruta de estudio sugerida

1. **Prisma schema** (`prisma/schema.prisma`) — entendé el modelo de datos primero.
2. **Un dominio completo** del backend (ej. `domains/catalog`): module → controller → service → dto.
3. **El flujo de pago** (`payments.service.ts`) — es el corazón y el más interesante.
4. **App Router + RSC** (`app/page.tsx` y `app/products/[slug]/page.tsx`).
5. **El carrito** (`commerce-provider.tsx` + `lib/commerce/cart.ts`).
6. **Tests** (`frontend/test/cart.test.ts`) — leerlos ayuda a entender la lógica.
7. **Deploy + seguridad** (`railway.json`, `next.config.ts`, hardening).

> Para la parte operativa/credenciales, ver `docs/SETUP-MANUAL.md`.
