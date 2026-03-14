import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const projectPathExists = (relativePath: string) =>
  fs.existsSync(path.join(process.cwd(), relativePath));

test('Backend module boundaries: domain ownership is explicit', () => {
  const appModule = readProjectFile('src/app.module.ts');
  const domainsModule = readProjectFile('src/domains/domains.module.ts');

  assert.match(appModule, /imports:\s*\[PlatformModule, DomainsModule\]/);
  assert.match(domainsModule, /CatalogModule/);
  assert.match(domainsModule, /InventoryModule/);
  assert.match(domainsModule, /OrdersModule/);
  assert.match(domainsModule, /PaymentsModule/);
  assert.match(domainsModule, /UsersModule/);
});

test('Backend module boundaries: shared concerns stay shared', () => {
  const platformModule = readProjectFile('src/platform/platform.module.ts');

  assert.match(platformModule, /PlatformConfigModule/);
  assert.match(platformModule, /AppLoggerModule/);
  assert.match(platformModule, /ProvidersModule/);
  assert.match(platformModule, /PrismaModule/);
  assert.match(platformModule, /HealthModule/);
  assert.match(platformModule, /MediaModule/);
});

test('Foundation scope guard: excluded features are not treated as in-scope', () => {
  assert.equal(projectPathExists('src/domains/shipping'), false);
  assert.equal(projectPathExists('src/domains/discounts'), false);
  assert.equal(projectPathExists('src/domains/reviews'), false);
  assert.equal(projectPathExists('src/domains/analytics'), false);
});

test('Catalog foundation: product and variant roles are distinct', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model Product \{/);
  assert.match(schema, /variants\s+ProductVariant\[]/);
  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /productId\s+String/);
  assert.match(schema, /product\s+Product\s+@relation\(fields: \[productId\]/);
});

test('Catalog foundation: variant inventory is independently tracked', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model InventoryItem \{/);
  assert.match(schema, /variantId\s+String\s+@unique/);
  assert.match(schema, /inventoryItem\s+InventoryItem\?/);
});

test('Catalog foundation: inventory state can represent reservation without shipment logic', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /availableQuantity\s+Int\s+@default\(0\)/);
  assert.match(schema, /reservedQuantity\s+Int\s+@default\(0\)/);
  assert.doesNotMatch(schema, /shipment|trackingNumber|carrier/i);
});

test('Catalog foundation: image persistence stores references only and ordering remains possible', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model ProductImage \{/);
  assert.match(schema, /assetUrl\s+String/);
  assert.match(schema, /assetKey\s+String\?/);
  assert.match(schema, /sortOrder\s+Int\s+@default\(0\)/);
  assert.match(schema, /@@index\(\[productId, sortOrder\]\)/);
  assert.doesNotMatch(schema, /ProductImage[\s\S]*Bytes/);
});

test('Orders and payments foundation: order and payment boundaries remain explicit', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model User \{/);
  assert.match(schema, /orders\s+Order\[]/);
  assert.match(schema, /model Order \{/);
  assert.match(schema, /userId\s+String\?/);
  assert.match(schema, /payments\s+Payment\[]/);
  assert.match(schema, /model Payment \{/);
  assert.match(schema, /orderId\s+String/);
  assert.match(schema, /order\s+Order\s+@relation\(fields: \[orderId\]/);
});

test('Orders and payments foundation: webhook idempotency is stored persistently', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model PaymentWebhookDelivery \{/);
  assert.match(schema, /providerEventId\s+String/);
  assert.match(schema, /@@unique\(\[provider, providerEventId\]\)/);
});

test('Orders and payments foundation: baseline stops before fulfillment and advanced post-payment operations', () => {
  const schema = readProjectFile('prisma/schema.prisma');
  const paymentsController = readProjectFile(
    'src/domains/payments/payments.controller.ts',
  );

  assert.doesNotMatch(schema, /shipment|tracking|carrier|deliveryWindow/i);
  assert.doesNotMatch(paymentsController, /refund|capture|chargeback/i);
});
