import assert from 'node:assert/strict';
import test from 'node:test';
import { MediaController } from './media.controller';

test('MediaController returns the product image upload contract', () => {
  const controller = new MediaController({
    createProductImageUploadSignature: () => ({
      cloudName: 'vendora',
      apiKey: 'key',
      folder: 'vendora/products/product-1',
      timestamp: 1_700_000_000,
      signature: 'signed',
    }),
  } as never);

  const result = controller.createProductImageUploadSignature({
    productId: 'product-1',
  });

  assert.deepEqual(result, {
    cloudName: 'vendora',
    apiKey: 'key',
    folder: 'vendora/products/product-1',
    timestamp: 1_700_000_000,
    signature: 'signed',
  });
});
