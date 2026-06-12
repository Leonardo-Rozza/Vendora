# Plan de Refactor Integral — Vendora

> Objetivo: llevar el MVP a un estado **funcional, seguro y profesional**, por fases.
> Modo de integraciones: **en seco** (Mercado Pago / Cloudinary / Postgres se dejan bien
> estructurados y listos para enchufar, sin probar contra los servicios reales todavía).
> Tests: **migrar a Jest (backend) / Vitest (frontend)**.

## Hallazgos que motivan el refactor (auditoría 2026-06-11)

**Críticos**
- Mercado Pago es un mock: `mercado-pago-checkout.provider.ts` inventa `preferenceId`/`initPoint`, no llama a ninguna API.
- Webhook de pago confía en un `status` enviado por el cliente, sin verificar firma → cualquiera puede marcar una orden como `PAID`. `MERCADOPAGO_WEBHOOK_SECRET` existe pero no se usa.
- `npm test` (backend) y `*.test.mjs` (frontend) hacen *regex sobre el código fuente como texto*; los `.spec.ts` reales quedan huérfanos. Cobertura efectiva ≈ 0.
- `<div hidden>` con texto en inglés en páginas de producción solo para satisfacer esos tests.
- `ADMIN_SESSION_SECRET` tiene default hardcodeado que aplica incluso en producción.

**Importantes**
- CORS abierto a cualquier `*.vercel.app` con `credentials:true`; sin CSRF en mutaciones admin.
- `scripts/patch-*.mjs` reescriben `node_modules` (hack de build roto).
- Basura commiteada: `backend/dist2/`, `backend/.tmp-create-order.dto.cjs`, `frontend/lib/shell-data.ts`.
- Tipos duplicados a mano frontend↔backend sin validación en runtime (`requestJson` hace `as T`).
- Catálogo y PDP cargados client-side con `useEffect` → se pierde SSR/SEO.
- `CartPageClient` monolítico (459 líneas).
- Env validation no exige variables críticas en prod; sin CHECK constraints en inventario.

**Menores**: a11y en formularios, `<img>` crudo en vez de `next/image`, `lint` no corre ESLint, idioma mezclado es/en, READMEs boilerplate.

---

## Fases

### Fase 0 — Limpieza y baseline ✅ HECHA (segura/reversible)
> Resultado: basura borrada; backend compila limpio con node_modules originales (el hack de
> patches era innecesario); frontend app compila limpio (solo fallan tests viejos, se migran en Fase 1).
- Borrar `backend/dist2/`, `backend/.tmp-create-order.dto.cjs`, `backend/scripts/patch-*.mjs`, `frontend/lib/shell-data.ts`.
- Actualizar `.gitignore` (dist2, .tmp-*).
- Diagnosticar por qué el build parcheaba `node_modules`; dejar `nest build` funcionando limpio.
- Baseline: ¿compila backend? ¿compila frontend?

### Fase 1 — Tests reales (Jest / Vitest) ✅ HECHA
- Backend: Jest + ts-jest. 16 specs migrados de `node:test`→Jest. **15 suites / 59 unit + 8 e2e en verde.**
  Borrado: `test-js/`, runners custom (`run-*-tests.ts`), y `foundation-baseline` (era string-matching).
  e2e actualizado a comportamiento real (health con notificationEmail; media signing ahora 401 admin-only).
- Frontend: Vitest + Testing Library (instalada para Fase 6). `commerce-*.test.ts` migrados → **14 tests en verde.**
  Borrados los `*.test.mjs` de string-matching y los `<div hidden>` marcadores de las 4 páginas.
  `allowImportingTsExtensions` en tsconfig; typecheck limpio.

### Fase 2 — Seguridad backend (crítico) ✅ HECHA
- CORS: eliminado el comodín `vercel.app`; solo allowlist explícita por `FRONTEND_APP_URL`.
  En producción una allowlist vacía deja de permitir todo.
- `ADMIN_SESSION_SECRET` obligatorio en producción (≥32 chars, no default) → falla el arranque.
  Env validation ahora exige `DATABASE_URL`, `ADMIN_SESSION_SECRET` y `FRONTEND_APP_URL` en prod.
- `cookie-parser` aplicado; `readSessionCookie` usa `request.cookies` (arregla el bug de prefijo).
- CSRF: `AdminSessionGuard` verifica el `Origin` contra la allowlist en métodos que mutan
  (SameSite=None en prod + verificación de origin, combinación correcta para cookie cross-site).
- `.env.example` documentando todas las variables y los requisitos de producción.
- Cobertura nueva: `app-config.service.spec.ts` (lógica de origin) + casos de prod en `env.validation.spec`.
- NOTA: la **firma del webhook de MP** (ignorar `status` del body + validar `x-signature`) se mueve a
  la **Fase 3**, porque está acoplada al provider real de Mercado Pago.

### Fase 3 — Integración Mercado Pago real (estructurada, en seco) ✅ HECHA
- Nueva abstracción `MercadoPagoGateway` (token DI `MERCADO_PAGO_GATEWAY`): `createCheckoutPreference`,
  `getPayment` (estado autoritativo + `externalReference`), `verifyWebhookSignature`.
- `MercadoPagoRealGateway` con el SDK oficial `mercadopago` (Preference/Payment +
  `WebhookSignatureValidator` oficial). `MercadoPagoFakeGateway` para dev/en seco.
  Selección por factory: real si hay credenciales, fake si no.
- **Webhook seguro:** verifica la firma ANTES de procesar (rechaza con 401 si es inválida);
  obtiene el estado real vía `getPayment` y **nunca** confía en el body; matchea la orden por
  `external_reference` y linkea `providerPaymentId`. `status` eliminado del DTO.
- Specs nuevos/actualizados (fake gateway, payments.service, e2e). 66 unit + 8 e2e en verde.
- Pendiente real (cuando haya credenciales): probar contra MP sandbox; Cloudinary ya OK server-side.

### Fase 4 — DB hardening + dominio ✅ HECHA
- Migración con CHECK `availableQuantity >= 0` y `reservedQuantity >= 0` (Prisma no expresa CHECK).
- `updateAvailableQuantity` envuelto en `$transaction`.
- Columna `Order.shippingAmount` (default 0) preparada para total = subtotal + envío.
- NOTA: en seco no se aplican las migraciones contra una DB real; quedan escritas y el schema valida.

### Fase 5 — Arquitectura frontend ✅ HECHA
- Catálogo y PDP ahora se renderizan en el server (RSC): `app/page.tsx` y `app/products/[slug]/page.tsx`
  hacen el fetch inicial; las islas client mantienen filtros/selección/add-to-cart.
- PDP: `notFound()` en 404 + `generateMetadata` (deduplicado con React `cache`); `not-found.tsx` y `error.tsx`.
- Ambas rutas quedan `ƒ Dynamic — server-rendered on demand` (verificado con `next build`).
- NOTA: el guard admin NO se hace con middleware: la cookie de sesión es cross-site (la setea el backend
  en su dominio), así que el frontend no puede leerla. Queda el guard client-side + la enforcement del backend.

### Fase 6 — Calidad frontend ✅ HECHA
- `CartPageClient` descompuesto en `<CheckoutForm>` + `<Field>` accesible reutilizable.
- Validación Zod en el borde para las responses públicas del catálogo (sin `as T` ciego).
- `<img>` → `next/image` (catálogo + PDP) + `images.remotePatterns` (Cloudinary).
- Pasada de a11y (labels asociados, `role="alert"`, `aria-live`) + `eslint-plugin-jsx-a11y` (warn).
- README real del frontend + `.env.example`.
- Verificado: `tsc`, `vitest` (14) y `next build` en verde.

### Fase 7 — Tooling / CI ✅ HECHA
- Backend `lint` ahora corre ESLint real (typed linting con `projectService`) + `typecheck` separado.
  Arreglados todos los hallazgos (formato + escapes innecesarios). `build` se mantiene en `tsc` (probado).
- Frontend: `eslint-plugin-jsx-a11y` activo (warn); arreglados 2 errores reales de `react-hooks/error-boundaries`
  (JSX dentro de try/catch en las páginas de PDP y seguimiento).
- `.github/workflows/ci.yml`: jobs de backend (lint, typecheck, test, e2e, build) y frontend
  (lint, test, build) en push a main y en PRs.

---

## Estado
- [x] Fase 0 — Limpieza y baseline
- [x] Fase 1 — Tests reales
- [x] Fase 2 — Seguridad backend
- [x] Fase 3 — Integración MP (en seco)
- [x] Fase 4 — DB hardening
- [x] Fase 5 — Arquitectura frontend
- [x] Fase 6 — Calidad frontend
- [x] Fase 7 — Tooling / CI
