import { MediaService } from './media.service';

test('MediaService creates a product image upload signature via Cloudinary seam', () => {
  let receivedArgs: unknown;
  const service = new MediaService({
    createProductImageUploadSignature: (args: unknown) => {
      receivedArgs = args;
      return {
        cloudName: 'vendora',
        apiKey: 'key',
        folder: 'vendora/products/product-1',
        timestamp: 1_700_000_000,
        signature: 'signed',
      };
    },
  } as never);

  const result = service.createProductImageUploadSignature({
    productId: 'product-1',
  });

  expect(result).toEqual({
    cloudName: 'vendora',
    apiKey: 'key',
    folder: 'vendora/products/product-1',
    timestamp: 1_700_000_000,
    signature: 'signed',
  });
  expect(receivedArgs).toEqual({
    productId: 'product-1',
  });
});
