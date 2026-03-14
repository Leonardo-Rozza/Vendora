import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('Storefront shell exposes navigable baseline areas', () => {
  const homeSource = readProjectFile('app/page.tsx');
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(homeSource, /app-shell/);
  assert.match(catalogSource, /CatalogToolbar/);
  assert.match(catalogSource, /CatalogFiltersPanel/);
  assert.match(catalogSource, /CatalogGrid/);
  assert.match(copySource, /Explora productos reales con filtros claros y una navegacion simple\./);
  assert.match(copySource, /Explorar por categoria/);
  assert.match(copySource, /Orden y rango de precio para navegar mejor/);
  assert.match(homeSource, /CatalogExperience/);
});

test('Storefront home keeps usable browse and cart destinations', () => {
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const layoutSource = readProjectFile('app/layout.tsx');
  const chromeSource = readProjectFile('components/layout/app-chrome.tsx');
  const headerSource = readProjectFile('components/storefront/storefront-header.tsx');
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(layoutSource, /AppChrome/);
  assert.match(chromeSource, /startsWith\("\/admin"\)/);
  assert.match(headerSource, /appCopy\.storefrontHeader/);
  assert.match(copySource, /Catalogo/);
  assert.match(copySource, /Categorias/);
  assert.match(copySource, /Explorar/);
  assert.match(copySource, /Carrito/);
  assert.match(catalogSource, /Busqueda:/);
  assert.match(catalogSource, /clearFilters/);
});

test('Storefront excludes out-of-scope claims from the commerce flow', () => {
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.doesNotMatch(catalogSource, /discounts|reviews|order history|sign in/i);
});

test('Cart and checkout result routes render customer-facing recovery states', () => {
  const cartSource = readProjectFile('components/cart/cart-page-client.tsx');
  const checkoutStatusSource = readProjectFile('components/checkout/checkout-status-client.tsx');
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const successSource = readProjectFile('app/checkout/success/page.tsx');
  const pendingSource = readProjectFile('app/checkout/pending/page.tsx');
  const failureSource = readProjectFile('app/checkout/failure/page.tsx');

  assert.match(cartSource, /appCopy\.cart/);
  assert.match(checkoutStatusSource, /appCopy\.checkoutStatus/);
  assert.match(copySource, /Tu carrito esta vacio\./);
  assert.match(successSource, /Payment success/);
  assert.match(successSource, /Webhook confirmation remains the final backend authority/);
  assert.match(pendingSource, /Payment pending/);
  assert.match(failureSource, /Payment failure/);
});

test('Admin shell exposes primary operational areas and stays distinct from storefront concerns', () => {
  const adminSource = readProjectFile('app/admin/page.tsx');
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const dashboardSource = readProjectFile('components/admin/admin-dashboard.tsx');

  assert.match(adminSource, /AdminDashboard/);
  assert.match(dashboardSource, /appCopy\.adminDashboard/);
  assert.match(copySource, /Operacion administrativa/);
  assert.match(copySource, /Ir a la tienda/);
  assert.match(copySource, /catalogo/i);
  assert.match(copySource, /inventario/i);
  assert.match(copySource, /pedidos AMBA/i);
  assert.match(copySource, /Cerrar sesion/);
  assert.match(dashboardSource, /admin-productos/);
  assert.match(dashboardSource, /admin-pedidos/);
});

test('Admin auth flow now exposes explicit sign-in and protected session language', () => {
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const loginSource = readProjectFile('components/admin/admin-login-form.tsx');

  assert.match(loginSource, /appCopy\.adminLogin/);
  assert.match(copySource, /Inicio de sesion/);
  assert.match(copySource, /Ingresar al admin/);
  assert.match(copySource, /credenciales iniciales configuradas por entorno/i);
  assert.match(copySource, /requieren una sesion administrativa activa/i);
});

test('Admin product editor uses guided sections instead of raw JSON textareas', () => {
  const editorSource = readProjectFile('components/admin/product-editor.tsx');
  const sectionsSource = readProjectFile('components/admin/product-form-sections.tsx');
  const ordersSource = readProjectFile('components/admin/order-list.tsx');

  assert.match(editorSource, /ProductFormSections/);
  assert.match(sectionsSource, /copy\.addVariant/);
  assert.match(sectionsSource, /copy\.addImage/);
  assert.doesNotMatch(editorSource, /Variants JSON|Images JSON/);
  assert.match(ordersSource, /appCopy\.adminOrders/);
});
