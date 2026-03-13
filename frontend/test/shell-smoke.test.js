const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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

  assert.match(adminSource, /Privileged admin shell/);
  assert.match(adminSource, /Return to storefront/);
  assert.match(adminSource, /catalog/i);
  assert.match(adminSource, /media/i);
  assert.match(adminSource, /inventory/i);
  assert.match(adminSource, /orders/i);
});

test('Admin shell defines workflow destinations without over-claiming auth completion', () => {
  const adminSource = readProjectFile('app/admin/page.tsx');

  assert.match(adminSource, /Auth reserved for later/);
  assert.match(
    adminSource,
    /Paid orders remain immutable regardless of future editing tools\./,
  );
  assert.doesNotMatch(adminSource, /sign in|session token|role assignment/i);
});
