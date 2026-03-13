const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

describe('Platform foundation (e2e)', () => {
  const baseUrl = process.env.E2E_API_BASE_URL ?? 'https://vendora-production-4f11.up.railway.app/api';
  const createCheckoutPayload = (variantId) => ({
    items: [{ variantId, quantity: 1 }],
    contact: {
      fullName: 'Ada Buyer',
      email: 'ada@example.com',
      phone: '11 5555 1111',
    },
    shippingAddress: {
      recipientName: 'Ada Buyer',
      phone: '11 5555 1111',
      streetLine1: 'Cabildo 123',
      locality: 'CABA',
      province: 'CABA',
      postalCode: 'C1426',
    },
  });

  async function requestJson(path, init) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    return { response, body };
  }

  test('/api/health (GET)', async () => {
    const { response, body } = await requestJson('/health');

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.app.name, 'vendora-backend');
    assert.equal(body.services.database.configured, true);
  });

  test('/api/catalog/products (GET) returns active products and supports search refinement', async () => {
    const { response, body } = await requestJson('/catalog/products');
    const { response: searchResponse, body: searchBody } = await requestJson(
      '/catalog/products?query=halo',
    );

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.length >= 1);
    assert.equal(searchResponse.status, 200);
    assert.ok(Array.isArray(searchBody));
    assert.ok(searchBody.every((product) => /halo/i.test(product.name) || product.variants.some((variant) => /halo|hal/i.test(variant.sku))));
  });

  test('/api/catalog/products/:slug (GET) returns detail and missing slugs 404', async () => {
    const { body: products } = await requestJson('/catalog/products');
    const { response, body } = await requestJson(`/catalog/products/${products[0].slug}`);
    const { response: missingResponse, body: missingBody } = await requestJson(
      '/catalog/products/does-not-exist',
    );

    assert.equal(response.status, 200);
    assert.equal(body.slug, products[0].slug);
    assert.ok(Array.isArray(body.variants));
    assert.equal(missingResponse.status, 404);
    assert.match(missingBody.message, /was not found/i);
  });

  test('/api/orders (POST) validates cart payloads and creates pending orders', async () => {
    const { body: products } = await requestJson('/catalog/products');
    const variantId = products[0].variants[0].id;
    const invalid = await requestJson('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ variantId: null, quantity: 0 }] }),
    });
    const created = await requestJson('/orders', {
      method: 'POST',
      body: JSON.stringify(createCheckoutPayload(variantId)),
    });

    assert.equal(invalid.response.status, 400);
    assert.match(invalid.body.message.join(' '), /variantId must be a string/i);
    assert.equal(created.response.status, 201);
    assert.equal(created.body.status, 'PENDING_PAYMENT');
    assert.equal(created.body.items[0].variantId, variantId);
  });

  test('/api/payments/checkout-preferences (POST) validates payloads and creates preferences', async () => {
    const invalid = await requestJson('/payments/checkout-preferences', {
      method: 'POST',
      body: JSON.stringify({ orderId: null, payerEmail: 'invalid-email' }),
    });
    const { body: products } = await requestJson('/catalog/products');
    const order = await requestJson('/orders', {
      method: 'POST',
      body: JSON.stringify(createCheckoutPayload(products[0].variants[0].id)),
    });
    const created = await requestJson('/payments/checkout-preferences', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.body.id, payerEmail: 'buyer@example.com' }),
    });

    assert.equal(invalid.response.status, 400);
    assert.match(invalid.body.message.join(' '), /orderId must be a string/i);
    assert.equal(created.response.status, 201);
    assert.equal(created.body.orderId, order.body.id);
    assert.equal(created.body.provider, 'mercado-pago');
    assert.ok(created.body.initPoint.includes('mercadopago.com/checkout'));
  });
});
