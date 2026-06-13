# Roadmap — de MVP a tienda completa

> Continuación del refactor integral (ver `REFACTOR-PLAN.md`). Objetivo: una tienda
> de ventas completa donde se descubran y adquieran productos varios.

## Decisiones tomadas
- **Diseño:** sistema de diseño primero (tokens + librería de componentes), y construir sobre eso.
- **Cuentas:** checkout de invitado (sin login obligatorio); seguimiento por email/token.
- **Alcance v1:** Descubrimiento (búsqueda, filtros por atributos, categorías/subcategorías, paginación).
- **Envíos:** solo AMBA por ahora.

## Cómo nos organizamos
- Una épica = una rama = un PR. El CI (lint + typecheck + test + build) ya corre en cada PR.
- Tests por feature con Jest (backend) / Vitest (frontend), siguiendo la base ya montada.
- Orden de trabajo: **(1) Sistema de diseño → (2) Descubrimiento → (3+) siguientes iteraciones.**
- Todo "en seco" para integraciones (MP/Cloudinary/DB) hasta tener credenciales.

---

## Fase D — Sistema de diseño (fundación, va primero)
Base visual coherente, accesible y reutilizable sobre la que se construye todo lo demás.
Hoy hay tokens sueltos en `globals.css` (`:root` + `@theme inline`, Tailwind v4) y solo 4
componentes en `components/ui/` (button, panel, pill, section-heading).

- **D1 · Tokens** formalizados en Tailwind v4 `@theme`: paleta con escalas, tipografía, spacing,
  radii, sombras, breakpoints, estados (hover/focus/disabled). Documentados.
- **D2 · Librería de componentes** (ampliar `components/ui/`): Button (variantes/tamaños), Field/Input,
  Select, Textarea, Badge, Card, Dialog/Modal, Toast, Skeleton, Pagination, Tabs, Breadcrumb, EmptyState.
  Todos accesibles (foco visible, aria, navegación por teclado).
- **D3 · Styleguide** en `/styleguide` (solo dev): muestra tokens + componentes; sirve de design review
  y catálogo vivo.
- **D4 · Adopción**: refactorizar las páginas actuales para usar los componentes nuevos (sin cambiar
  funcionalidad).
- **Hecho cuando:** styleguide navegable, tokens aplicados, a11y sin errores, build/test verdes.

## Fase B — Descubrimiento (v1 funcional)
Que se encuentren y comparen productos varios con facilidad.

**Backend**
- **B1 · Categorías con jerarquía** ✅ HECHA: modelo `Category` (id, name, slug, parentId) reemplaza el enum;
  migración con backfill + seed (3 categorías); `CategoriesService` (árbol + descendientes); endpoint
  `GET /catalog/categories`; filtro de catálogo por slug que incluye descendientes; facet con id/slug/parentId/count.
  Frontend: contracts/zod/api al nuevo contrato, navegación por árbol de categorías, breadcrumb en PDP,
  selector de categoría real en admin. 70 unit + 8 e2e (back) y 17 (front) en verde.
- **B2 · Atributos dinámicos**: implementar `Attribute / AttributeValue / ProductAttributeValue`
  (ya previstos en el PRD); migración. Habilitan filtros tipo color/material/capacidad.
- **B3 · Búsqueda**: full-text en nombre/descripción (Postgres `tsvector`, o ILIKE para arrancar) + orden.
- **B4 · Paginación + facets**: limit/offset (o cursor) en el endpoint de catálogo y conteos por filtro.
- **B5 · Relacionados**: productos relacionados por categoría/atributos para la PDP.

**Frontend**
- **B6 · Búsqueda**: barra con resultados y estado vacío.
- **B7 · Filtros por atributos**: sidebar dinámico según facets + chips activos.
- **B8 · Categorías/subcategorías**: navegación, breadcrumb y páginas de categoría.
- **B9 · Paginación**: controles (o "cargar más") en la grilla.
- **B10 · Relacionados**: sección en la PDP.
- **Hecho cuando:** buscar, filtrar por atributos, navegar categorías y paginar funcionando, con tests.

---

## Siguientes iteraciones (después de v1, ya con prioridad acordada)
- **Checkout pro**: carrito persistente, cupones/descuentos, validación de stock en vivo (envíos siguen AMBA).
- **Invitado mejorado**: página "seguí tu pedido" por email+token, reenvío de tracking.
- **Post-venta & confianza**: reviews/ratings, wishlist, cancelación por el cliente.
- **Admin & métricas**: dashboard de ventas/top productos, gestión masiva de stock, cupones, categorías/atributos.

## Estado
- [~] Fase D — Sistema de diseño (D1 tokens, D2 componentes, D3 styleguide ✅; D4 adopción: incremental)
- [x] Fase B — Descubrimiento (v1): B1 categorías ✅, B2 atributos ✅, B3-B4 búsqueda+paginación ✅, B5 relacionados ✅
- [ ] Checkout pro
- [ ] Invitado mejorado
- [ ] Post-venta & confianza
- [ ] Admin & métricas
