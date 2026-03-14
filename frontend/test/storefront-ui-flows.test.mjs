import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('catalog UI includes unavailable-state retry affordance', () => {
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const source = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(source, /loadProducts\(activeFilters\)/);
  assert.match(source, /CatalogFiltersPanel/);
  assert.match(copySource, /El catalogo no esta disponible por el momento\./);
  assert.match(copySource, /Reintentar catalogo/);
});

test('catalog UI exposes category, search, price, and sort browsing controls', () => {
  const experienceSource = readProjectFile('components/storefront/catalog-experience.tsx');
  const toolbarSource = readProjectFile('components/storefront/catalog-toolbar.tsx');
  const filtersSource = readProjectFile('components/storefront/catalog-filters.tsx');

  assert.match(experienceSource, /handleQuickCategory/);
  assert.match(toolbarSource, /sort/i);
  assert.match(toolbarSource, /onToggleFilters/);
  assert.match(filtersSource, /minPriceAmount/);
  assert.match(filtersSource, /maxPriceAmount/);
  assert.match(filtersSource, /onCategoryChange/);
});

test('product detail UI includes product-not-found recovery', () => {
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const source = readProjectFile('components/product/product-detail-client.tsx');

  assert.match(source, /stockLabel/);
  assert.match(source, /describeVariantStock/);
  assert.match(copySource, /Producto no disponible/);
  assert.match(copySource, /Volver al catalogo/);
});

test('storefront flow includes explicit responsive layout classes', () => {
  const catalogSource = readProjectFile('components/storefront/catalog-experience.tsx');
  const cartSource = readProjectFile('components/cart/cart-page-client.tsx');
  const productSource = readProjectFile('components/product/product-detail-client.tsx');

  assert.match(catalogSource, /sm:/);
  assert.match(catalogSource, /lg:/);
  assert.match(cartSource, /sm:/);
  assert.match(cartSource, /lg:/);
  assert.match(productSource, /sm:/);
  assert.match(productSource, /lg:/);
});

test('cart checkout UI captures AMBA-only delivery scope and contact fields', () => {
  const copySource = readProjectFile('lib/copy/es-ar.ts');
  const cartSource = readProjectFile('components/cart/cart-page-client.tsx');

  assert.match(cartSource, /contactSection/);
  assert.match(cartSource, /shippingSection/);
  assert.match(copySource, /Cobertura actual/);
  assert.match(copySource, /Envios disponibles solo en CABA y AMBA/);
});
