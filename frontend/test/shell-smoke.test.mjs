import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('Storefront shell exposes navigable baseline areas', () => {
  const homeSource = readProjectFile('app/page.tsx');
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(catalogSource, /Storefront commerce flow/);
  assert.match(
    catalogSource,
    /Discover real catalog inventory and move straight into checkout\./,
  );
  assert.match(catalogSource, /Catalog search/);
  assert.match(catalogSource, /Variant-aware product detail/);
  assert.match(catalogSource, /Cart to Mercado Pago handoff/);
  assert.match(catalogSource, /Active products from the backend catalog API\./);
  assert.match(homeSource, /CatalogExperience/);
});

test('Storefront home keeps usable browse and cart destinations', () => {
  const headerSource = readProjectFile('components/storefront/storefront-header.tsx');
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(headerSource, /Browse/);
  assert.match(headerSource, /Cart/);
  assert.match(catalogSource, /Search(?:ing)?\.\.\.|Search catalog/);
  assert.match(catalogSource, /Catalog landing/);
});

test('Storefront excludes out-of-scope claims from the commerce flow', () => {
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.doesNotMatch(catalogSource, /discounts|reviews|order history|sign in/i);
});

test('Cart and checkout result routes render customer-facing recovery states', () => {
  const cartSource = readProjectFile('components/cart/cart-page-client.tsx');
  const successSource = readProjectFile('app/checkout/success/page.tsx');
  const pendingSource = readProjectFile('app/checkout/pending/page.tsx');
  const failureSource = readProjectFile('app/checkout/failure/page.tsx');

  assert.match(cartSource, /Cart destination/);
  assert.match(cartSource, /Your cart is empty\./);
  assert.match(successSource, /Payment success/);
  assert.match(successSource, /Webhook confirmation remains the final backend authority/);
  assert.match(pendingSource, /Payment pending/);
  assert.match(failureSource, /Payment failure/);
});

test('Admin shell exposes primary operational areas and stays distinct from storefront concerns', () => {
  const adminSource = readProjectFile('app/admin/page.tsx');
  const dashboardSource = readProjectFile('components/admin/admin-dashboard.tsx');

  assert.match(adminSource, /AdminDashboard/);
  assert.match(dashboardSource, /Privileged admin shell/);
  assert.match(dashboardSource, /Return to storefront/);
  assert.match(dashboardSource, /catalog/i);
  assert.match(dashboardSource, /inventory/i);
  assert.match(dashboardSource, /purchase requests/i);
  assert.match(dashboardSource, /Logout/);
});

test('Admin auth flow now exposes explicit sign-in and protected session language', () => {
  const loginSource = readProjectFile('components/admin/admin-login-form.tsx');

  assert.match(loginSource, /Admin sign in/);
  assert.match(loginSource, /Sign in to admin/);
  assert.match(loginSource, /environment-backed initial admin credentials/i);
  assert.match(
    loginSource,
    /Product changes, inventory updates, and order review require an active admin session\./,
  );
});
