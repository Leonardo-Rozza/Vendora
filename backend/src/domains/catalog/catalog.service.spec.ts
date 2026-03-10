import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogService } from './catalog.service';

test('CatalogService loads a product foundation aggregate by slug', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService({
    product: {
      findUnique: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'product-1' };
      },
    },
  } as never);

  const result = await service.findProductBySlug('mate-gourd');

  assert.deepEqual(result, { id: 'product-1' });
  assert.deepEqual(receivedArgs, {
    where: { slug: 'mate-gourd' },
    include: {
      variants: true,
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
});
