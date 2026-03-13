const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('environment validation uses lightweight runtime-safe parsing', () => {
  const source = readProjectFile('src/platform/config/env.validation.ts');

  assert.match(source, /export function validateEnvironment/);
  assert.match(source, /readOptionalUrl/);
  assert.doesNotMatch(source, /import Joi from 'joi'/);
});

test('backend schema keeps commerce entities aligned for storefront flow', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model Product \{/);
  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /model InventoryItem \{/);
  assert.match(schema, /model Order \{/);
  assert.match(schema, /model Payment \{/);
  assert.match(schema, /model PaymentWebhookDelivery \{/);
});

test('Mercado Pago provider includes storefront return URL wiring', () => {
  const provider = readProjectFile(
    'src/platform/providers/mercado-pago/mercado-pago-checkout.provider.ts',
  );

  assert.match(provider, /backUrls/);
  assert.match(provider, /checkout\/success/);
  assert.match(provider, /checkout\/pending/);
  assert.match(provider, /checkout\/failure/);
  assert.match(provider, /autoReturn/);
});

test('storefront scope stays free of excluded backend domains', () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/shipping')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/discounts')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/reviews')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/analytics')), false);
});
