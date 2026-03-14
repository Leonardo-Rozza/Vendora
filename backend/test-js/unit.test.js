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

test('admin auth and authorization wiring exists for protected operations', () => {
  const authController = readProjectFile('src/domains/auth/auth.controller.ts');
  const authService = readProjectFile('src/domains/auth/auth.service.ts');
  const configureApp = readProjectFile('src/platform/configure-app.ts');
  const appConfigService = readProjectFile('src/platform/config/app-config.service.ts');
  const adminCatalogController = readProjectFile('src/domains/catalog/admin-catalog.controller.ts');
  const inventoryController = readProjectFile('src/domains/inventory/inventory.controller.ts');

  assert.match(authController, /@Controller\('admin\/auth'\)/);
  assert.match(authController, /@Post\('login'\)/);
  assert.match(authController, /@Post\('logout'\)/);
  assert.match(authService, /ensureBootstrappedAdmin/);
  assert.match(authService, /adminSessionSecret/);
  assert.match(authService, /adminSessionCookieSameSite/);
  assert.match(configureApp, /isAllowedFrontendOrigin/);
  assert.match(configureApp, /CORS blocked origin/);
  assert.match(appConfigService, /frontendAppUrls/);
  assert.match(adminCatalogController, /@UseGuards\(AdminSessionGuard\)/);
  assert.match(inventoryController, /@UseGuards\(AdminSessionGuard\)/);
});

test('order intake captures buyer fulfillment data and enforces AMBA shipping scope', () => {
  const orderDto = readProjectFile('src/domains/orders/dto/create-order.dto.ts');
  const ordersService = readProjectFile('src/domains/orders/orders.service.ts');
  const ambaScope = readProjectFile('src/domains/orders/amba-shipping.ts');

  assert.match(orderDto, /contact!:/);
  assert.match(orderDto, /shippingAddress!:/);
  assert.match(ordersService, /Shipping is currently limited to AMBA destinations/);
  assert.match(ordersService, /contactFullName/);
  assert.match(ordersService, /shippingRecipientName/);
  assert.match(ambaScope, /AMBA_LOCALITIES/);
  assert.match(ambaScope, /buenos aires/);
});

test('fulfillment operations add a separate AMBA admin workflow', () => {
  const schema = readProjectFile('prisma/schema.prisma');
  const ordersController = readProjectFile('src/domains/orders/orders.controller.ts');
  const ordersService = readProjectFile('src/domains/orders/orders.service.ts');
  const fulfillmentHelpers = readProjectFile('src/domains/orders/fulfillment-status.ts');

  assert.match(schema, /enum FulfillmentStatus/);
  assert.match(schema, /fulfillmentStatus\s+FulfillmentStatus/);
  assert.match(schema, /fulfillmentNotes\s+String\?/);
  assert.match(schema, /deliveryReference\s+String\?/);
  assert.match(ordersController, /@Patch\('admin\/orders\/:orderId\/fulfillment'\)/);
  assert.match(ordersService, /updateOrderFulfillment/);
  assert.match(ordersService, /must be paid before fulfillment can advance/);
  assert.match(fulfillmentHelpers, /NEXT_FULFILLMENT_STATUS/);
  assert.match(fulfillmentHelpers, /OUT_FOR_DELIVERY/);
});
