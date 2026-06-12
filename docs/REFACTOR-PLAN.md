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

### Fase 3 — Integración Mercado Pago real (estructurada, en seco)
- Implementar provider real con SDK `mercadopago` detrás de la interfaz actual: `createCheckoutPreference` real + `getPayment(resourceId)` para confirmar estado real en el webhook.
- **Webhook (movido desde Fase 2):** validar firma `x-signature` con el secret; **ignorar** cualquier `status` del body; obtener el estado real vía `getPayment`. Sacar `status` del DTO.
- Modo `fake`/`stub` activable por env para dev sin credenciales (default en seco).
- Revisar Cloudinary (ya OK server-side).

### Fase 4 — DB hardening + dominio
- Migración: `CHECK (availableQuantity >= 0 AND reservedQuantity >= 0)`.
- Envolver `updateAvailableQuantity` en transacción.
- Separar `shippingAmount` de `total` (dejar preparado).

### Fase 5 — Arquitectura frontend
- Mover fetch de catálogo y PDP a server components (RSC) con `loading.tsx`/`error.tsx`; islas client para filtros/add-to-cart.
- Guard admin server-side (`middleware.ts`).

### Fase 6 — Calidad frontend
- Descomponer `CartPageClient` → `<CheckoutForm>` + `<Field>` reutilizable.
- Tipos compartidos + validación Zod en el borde (`requestJson`).
- `next/image` + `images.remotePatterns` (Cloudinary).
- Pasada de a11y + `eslint-plugin-jsx-a11y`.
- Consistencia de idioma, README real, `.env.example`.

### Fase 7 — Tooling / CI
- `lint` con ESLint real (backend); `build` con `nest build`.
- GitHub Actions: test + build en push/PR.

---

## Estado
- [x] Fase 0 — Limpieza y baseline
- [x] Fase 1 — Tests reales
- [x] Fase 2 — Seguridad backend
- [ ] Fase 3 — Integración MP (en seco)
- [ ] Fase 4 — DB hardening
- [ ] Fase 5 — Arquitectura frontend
- [ ] Fase 6 — Calidad frontend
- [ ] Fase 7 — Tooling / CI
