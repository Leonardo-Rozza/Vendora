import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ConfigurationUnavailableError,
  type CapabilityStatus,
} from '../../config/app-config.service';
import { CloudinarySigningProvider } from './cloudinary-signing.provider';

test('CloudinarySigningProvider creates a deterministic product image upload signature', () => {
  const provider = new CloudinarySigningProvider({
    requireCloudinaryConfig: () => ({
      cloudName: 'vendora',
      apiKey: 'key-123',
      apiSecret: 'secret-456',
    }),
  } as never);

  const result = provider.createProductImageUploadSignature({
    productId: 'product-1',
    timestamp: 1_700_000_000,
  });

  assert.deepEqual(result, {
    cloudName: 'vendora',
    apiKey: 'key-123',
    folder: 'vendora/products/product-1',
    timestamp: 1_700_000_000,
    signature: '7bc8186f2d288609951461f7a973067596811562',
  });
});

test('CloudinarySigningProvider fails when Cloudinary is unavailable', () => {
  const provider = new CloudinarySigningProvider({
    requireCloudinaryConfig: () => {
      throw new ConfigurationUnavailableError(
        'cloudinary',
        'Missing credentials',
      );
    },
    cloudinaryStatus: {
      configured: false,
      reason: 'Missing credentials',
    } as CapabilityStatus,
  } as never);

  assert.throws(
    () =>
      provider.createProductImageUploadSignature({
        productId: 'product-1',
        timestamp: 1_700_000_000,
      }),
    /cloudinary is not configured/,
  );
});
