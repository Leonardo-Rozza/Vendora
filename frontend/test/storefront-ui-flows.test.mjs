import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('catalog UI includes unavailable-state retry affordance', () => {
  const source = readProjectFile('components/storefront/catalog-experience.tsx');

  assert.match(source, /Catalog is temporarily unavailable\./);
  assert.match(source, /Retry catalog/);
  assert.match(source, /loadProducts\(activeQuery\)/);
});

test('product detail UI includes product-not-found recovery', () => {
  const source = readProjectFile('components/product/product-detail-client.tsx');

  assert.match(source, /Product not found/);
  assert.match(source, /Back to catalog/);
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
  const cartSource = readProjectFile('components/cart/cart-page-client.tsx');

  assert.match(cartSource, /Contact full name/);
  assert.match(cartSource, /Locality/);
  assert.match(cartSource, /Province/);
  assert.match(cartSource, /Shipping scope: AMBA only/);
});
