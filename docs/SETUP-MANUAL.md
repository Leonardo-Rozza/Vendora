# Vendora — Tareas manuales (credenciales, servicios externos y validaciones)

Esto es **todo lo que necesita tu intervención** (cuentas, API keys, DNS, pruebas).
El código ya está listo para todo esto; solo falta encender cada servicio con sus
variables y validar. Hacelo en el orden que quieras, pero el recomendado está abajo.

Leyenda:
- 🟢 **Hecho en código** — ya está implementado, solo necesita las variables.
- 🟡 **Acción tuya** — algo que tenés que hacer/configurar a mano.
- ✅ **Validación** — prueba para confirmar que quedó andando.

Orden recomendado: **1) Env base → 2) Mercado Pago → 3) Email → 4) Cloudinary → 5) SEO/dominio**.

---

## 0. Dónde se cargan las variables

- **Backend (Railway):** servicio backend → pestaña **Variables**.
- **Frontend (Vercel):** proyecto → **Settings → Environment Variables** (marcá *Production*).
- Después de cambiar variables: **Railway redeploya solo**; en **Vercel** hay que hacer **Redeploy** del último deploy para que tome las nuevas.

> ⚠️ Recordatorio del deploy: el **Custom Start Command** del backend en Railway debe quedar en
> `npx prisma migrate deploy && node dist/main` (NO el de `reset`). Ver `memory/railway-deploy.md`.

---

## 1. Variables base (obligatorias) 🟡

### Backend (Railway → Variables)

| Variable | Valor / cómo obtenerlo | Estado |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia interna de Railway, NO el proxy público) | 🟢 ya seteada |
| `ADMIN_SESSION_SECRET` | Generá uno fuerte: `openssl rand -base64 48`. Mín. 32 chars. | 🟢 ya seteada |
| `FRONTEND_APP_URL` | La URL de tu frontend en Vercel, ej. `https://vendora.vercel.app` (sin barra final). Se usa para CORS, CSRF y el link de seguimiento en los emails. | 🟡 **confirmá** |
| `NODE_ENV` | `production` | 🟡 confirmá |
| `PORT` | Railway lo inyecta solo (8080). No hace falta tocarlo. | — |

Opcionales de sesión admin (tienen default sano): `ADMIN_SESSION_COOKIE_NAME`,
`ADMIN_SESSION_COOKIE_SAME_SITE` (default `none` en prod), `ADMIN_SESSION_TTL_HOURS` (12).

### Frontend (Vercel → Environment Variables)

| Variable | Valor | Estado |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL pública del backend en Railway **con `/api`**, ej. `https://vendora-backend.up.railway.app/api` | 🟡 **confirmá** |

✅ **Validación:** abrí la home en Vercel → carga el catálogo sin error 500. Entrá a `/admin` → Productos y Órdenes cargan sin "Internal server error".

---

## 2. Admin: crear tu usuario 🟡

El login admin valida contra un usuario en la base (sembrado por el seed) o por las
variables de bootstrap. Tenés dos caminos:

**Opción A — Bootstrap por variables (recomendado):** en Railway seteá juntas:
```
ADMIN_INITIAL_EMAIL    = tuemail@dominio.com
ADMIN_INITIAL_PASSWORD = (una contraseña fuerte)
```
Redeploy. Esto siembra el primer admin al arrancar.

**Opción B — Seed manual:** en la shell del servicio backend corré `node prisma/seed.cjs`
(idempotente; crea categorías/atributos/cupón base y, si configuraste las vars de
bootstrap, el admin).

✅ **Validación:** entrá a `/admin/login` con ese email/clave → entrás al panel.

---

## 3. Mercado Pago (checkout + webhooks) 🟢 código / 🟡 config

### 3.1 Conseguir credenciales
1. Entrá a **mercadopago.com.ar/developers** → **Tus integraciones** → creá una aplicación
   (tipo: *Pagos online / Checkout Pro*).
2. En la app vas a tener dos juegos de credenciales: **Sandbox (test)** y **Producción**.
   Arrancá con **Sandbox**.
3. Copiá el **Access Token** (sandbox primero: empieza con `TEST-...`).

### 3.2 Configurar el webhook (notificaciones)
1. En la app → **Webhooks / Notificaciones**, configurá la URL:
   ```
   https://<tu-backend>.up.railway.app/api/payments/webhooks/mercado-pago
   ```
2. Suscribí el evento **Pagos** (`payment`).
3. Mercado Pago te da una **clave secreta de firma** → ese es tu `MERCADOPAGO_WEBHOOK_SECRET`.
   (El backend **verifica la firma** de cada webhook y rechaza los no firmados.)

### 3.3 Variables (Railway → backend)
```
MERCADOPAGO_ACCESS_TOKEN   = TEST-xxxx   (luego el de producción APP_USR-xxxx)
MERCADOPAGO_WEBHOOK_SECRET = (la clave de firma del webhook)
```
(Ambas son requeridas juntas para habilitar checkout/webhooks.)

### 3.4 Probar con tarjetas de test
Mercado Pago da tarjetas de prueba (panel de developers → *Tarjetas de prueba*). Ejemplo típico:
- **Aprobada:** Mastercard `5031 7557 3453 0604`, venc. `11/30`, CVV `123`, titular `APRO`.
- **Rechazada:** usar titular `OTHE` / `CONT` según el estado que quieras simular.
- DNI de prueba: `12345678`.

✅ **Validación (flujo core):**
1. Agregá un producto al carrito → Checkout → completá datos (zona AMBA) → "Pagar".
2. Te redirige a Mercado Pago → pagá con la tarjeta **APRO**.
3. Volvés a la tienda (success). En los **logs del backend** tenés que ver
   `payment.webhook.processed`.
4. En el **admin → Órdenes** la orden queda en **PAID** y el **stock se descontó**.
5. (Si configuraste el email) llega el mail de **"Pago confirmado"**.

> Cuando todo funcione en sandbox, repetí con las credenciales de **Producción**
> (`APP_USR-...`) y el webhook apuntando a la misma URL.

---

## 4. Email transaccional (Resend) 🟢 código / 🟡 config

El código ya manda emails con **template de marca** en 3 hitos: **pago confirmado**,
**en camino** y **entregado**. Es idempotente y best-effort (si falla, no rompe el pago).

### 4.1 Setup en Resend
1. Registrate en **resend.com** (free: 3.000 mails/mes).
2. **Domains → Add Domain** → cargá tu dominio y poné en tu DNS los registros
   **SPF + DKIM** que te muestra → **Verify**.
   - *Para probar sin dominio propio:* usá el remitente `onboarding@resend.dev`
     (solo te deja enviarte a vos mismo, sirve para validar el flujo).
3. **API Keys → Create API Key** (permiso *Sending*). Copiala (`re_...`).

### 4.2 Variables (Railway → backend)
```
NOTIFICATION_EMAIL_API_KEY    = re_xxxxxxxx
NOTIFICATION_EMAIL_FROM       = pedidos@tudominio.com.ar   (o onboarding@resend.dev)
NOTIFICATION_EMAIL_FROM_NAME  = Vendora
NOTIFICATION_EMAIL_REPLY_TO   = soporte@tudominio.com.ar   (opcional)
```
`NOTIFICATION_EMAIL_API_BASE_URL` ya defaultea a `https://api.resend.com`.

> ⚠️ El `FROM` debe ser de un **dominio verificado** en Resend (o `onboarding@resend.dev`),
> si no Resend rechaza el envío.

✅ **Validación:** hacé una compra que llegue a PAID (o desde admin avanzá el fulfillment
de una orden a "en camino"/"entregado"). Revisá en **Resend → Emails** que figure enviado
y que te haya llegado el mail.

---

## 5. Cloudinary (subida de imágenes de productos) 🟢 código / 🟡 config

El admin ya tiene **subida real con firma** (signed upload): elegís el archivo y se sube a
Cloudinary sin pegar URLs a mano. Necesita las 3 credenciales.

### 5.1 Setup en Cloudinary
1. Registrate en **cloudinary.com** (free generoso).
2. En el **Dashboard** tenés: **Cloud name**, **API Key** y **API Secret**.

### 5.2 Variables (Railway → backend)
```
CLOUDINARY_CLOUD_NAME  = tu-cloud-name
CLOUDINARY_API_KEY     = xxxxxxxxxxxx
CLOUDINARY_API_SECRET  = xxxxxxxxxxxx
```
(Las 3 son requeridas juntas para habilitar la firma de subida.)

✅ **Validación:** admin → editá un producto → subí una imagen → se ve la preview y al
guardar queda asociada. (Las imágenes van a la carpeta `vendora/products/<id>` en Cloudinary.)

> Nota: la subida se habilita cuando el producto **ya existe** (tiene id). Para uno nuevo,
> guardalo primero y después subí las imágenes (o usá el campo de URL como fallback).

---

## 6. SEO y dominio propio 🟢 código / 🟡 config

🟢 Ya implementado (no requiere acción): `sitemap.xml`, `robots.txt`, Open Graph y
metadata por producto. Solo necesita saber la URL pública del sitio.

🟡 **Acción tuya:**
1. En **Vercel** seteá la variable del sitio (para sitemap/OG con URL absoluta):
   ```
   NEXT_PUBLIC_SITE_URL = https://tudominio.com.ar   (o la URL de vercel.app por ahora)
   ```
2. **Dominio propio (opcional):** Vercel → Settings → Domains → agregá tu dominio y cargá el
   CNAME/registros que indique en tu proveedor de DNS. Cuando el dominio quede activo,
   actualizá `FRONTEND_APP_URL` (backend) y `NEXT_PUBLIC_SITE_URL` (frontend) a ese dominio.

✅ **Validación:** abrí `https://<tu-sitio>/sitemap.xml` y `/robots.txt` → responden.
Compartí un link de producto en WhatsApp/redes → aparece la preview con imagen y título.

---

## Checklist rápido de variables

**Railway (backend):**
- [ ] `DATABASE_URL` (interno)
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `FRONTEND_APP_URL`
- [ ] `NODE_ENV=production`
- [ ] `ADMIN_INITIAL_EMAIL` + `ADMIN_INITIAL_PASSWORD`
- [ ] `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] `NOTIFICATION_EMAIL_API_KEY` + `NOTIFICATION_EMAIL_FROM` (+ FROM_NAME / REPLY_TO)
- [ ] `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
- [ ] Custom Start Command = `npx prisma migrate deploy && node dist/main`

**Vercel (frontend):**
- [ ] `NEXT_PUBLIC_API_BASE_URL` (con `/api`)
- [ ] `NEXT_PUBLIC_SITE_URL`

## Checklist de validaciones funcionales
- [ ] Home y catálogo cargan (sin 500)
- [ ] Login admin OK
- [ ] Compra sandbox → orden PAID + stock descontado + webhook `processed`
- [ ] Email de "pago confirmado" llega
- [ ] Subida de imagen en admin funciona
- [ ] `/sitemap.xml` y `/robots.txt` responden
- [ ] (Cuando esté todo) repetir compra con credenciales de **producción** de MP
