import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { CatalogService } from './catalog.service';

test('CatalogService lists only active catalog products and applies search filters', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService({
    product: {
      findMany: async (args: unknown) => {
        receivedArgs = args;
        return [{ id: 'product-1' }];
      },
    },
  } as never);

  const result = await service.listProducts({ query: 'mate' });

  assert.deepEqual(result, [{ id: 'product-1' }]);
  assert.deepEqual(receivedArgs, {
    where: {
      status: 'ACTIVE',
      OR: [
        {
          name: {
            contains: 'mate',
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: 'mate',
            mode: 'insensitive',
          },
        },
        {
          variants: {
            some: {
              sku: {
                contains: 'mate',
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    },
    include: {
      variants: {
        include: {
          inventoryItem: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});

test('CatalogService returns an empty collection when no active products match the search', async () => {
  const service = new CatalogService({
    product: {
      findMany: async () => [],
    },
  } as never);

  const result = await service.listProducts({ query: 'missing' });

  assert.deepEqual(result, []);
});

test('CatalogService loads an active product aggregate by slug', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService({
    product: {
      findFirst: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'product-1' };
      },
    },
  } as never);

  const result = await service.findProductBySlug('mate-gourd');

  assert.deepEqual(result, { id: 'product-1' });
  assert.deepEqual(receivedArgs, {
    where: { slug: 'mate-gourd', status: 'ACTIVE' },
    include: {
      variants: {
        include: {
          inventoryItem: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });
});

test('CatalogService creates a product with variants, inventory, and images', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService({
    product: {
      create: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'product-1' };
      },
    },
  } as never);

  const result = await service.createProduct({
    slug: 'mate-gourd',
    name: 'Mate Gourd',
    description: 'Classic mate.',
    status: 'ACTIVE',
    variants: [
      {
        sku: 'SKU-1',
        name: 'Standard',
        priceAmount: '12500.00',
        currencyCode: 'ars',
        availableQuantity: 5,
      },
    ],
    images: [
      {
        assetUrl: 'https://cdn.example.com/mate.jpg',
        assetKey: 'mate.jpg',
        altText: 'Mate gourd',
        sortOrder: 0,
      },
    ],
  });

  assert.deepEqual(result, { id: 'product-1' });
  const createArgs = receivedArgs as {
    data: {
      slug: string;
      name: string;
      description: string;
      status: string;
      variants: { create: Array<{ priceAmount: Prisma.Decimal; currencyCode: string }> };
      images: { create: Array<{ assetUrl: string }> };
    };
  };
  assert.equal(createArgs.data.slug, 'mate-gourd');
  assert.equal(createArgs.data.name, 'Mate Gourd');
  assert.equal(createArgs.data.description, 'Classic mate.');
  assert.equal(createArgs.data.status, 'ACTIVE');
  assert.equal(createArgs.data.variants.create[0]?.currencyCode, 'ARS');
  assert.equal(createArgs.data.variants.create[0]?.priceAmount.toString(), '12500');
  assert.equal(
    createArgs.data.images.create[0]?.assetUrl,
    'https://cdn.example.com/mate.jpg',
  );
});

test('CatalogService updates product fields and existing variants', async () => {
  const calls: Record<string, unknown> = {};
  let readCount = 0;
  const service = new CatalogService({
    $transaction: async (callback: (client: any) => Promise<unknown>) =>
      callback({
        product: {
          findUnique: async (args: unknown) => {
            readCount += 1;
            if (readCount === 1) {
              calls.productRead = args;
              return {
                id: 'product-1',
                variants: [{ id: 'variant-1' }],
              };
            }

            calls.productReadAfter = args;
            return { id: 'product-1', variants: [], images: [] };
          },
          update: async (args: unknown) => {
            calls.productUpdate = args;
            return args;
          },
        },
        productImage: {
          deleteMany: async (args: unknown) => {
            calls.imageDeleteMany = args;
            return args;
          },
          createMany: async (args: unknown) => {
            calls.imageCreateMany = args;
            return args;
          },
        },
        productVariant: {
          update: async (args: unknown) => {
            calls.variantUpdate = args;
            return args;
          },
          create: async (args: unknown) => {
            calls.variantCreate = args;
            return { id: 'variant-2' };
          },
        },
        inventoryItem: {
          findUnique: async () => ({ variantId: 'variant-1' }),
          update: async (args: unknown) => {
            calls.inventoryUpdate = args;
            return args;
          },
          create: async (args: unknown) => {
            calls.inventoryCreate = args;
            return args;
          },
        },
      }),
  } as never);

  const result = await service.updateProduct('product-1', {
    name: 'Updated Mate Gourd',
    variants: [
      {
        id: 'variant-1',
        sku: 'SKU-1',
        name: 'Premium',
        priceAmount: '13000.00',
        currencyCode: 'ars',
        availableQuantity: 8,
      },
    ],
    images: [
      {
        assetUrl: 'https://cdn.example.com/mate-2.jpg',
        assetKey: 'mate-2.jpg',
        altText: 'Updated mate',
        sortOrder: 1,
      },
    ],
  });

  assert.deepEqual(result, { id: 'product-1', variants: [], images: [] });
  assert.deepEqual(calls.productUpdate, {
    where: { id: 'product-1' },
    data: {
      slug: undefined,
      name: 'Updated Mate Gourd',
      description: undefined,
      status: undefined,
    },
  });
  assert.deepEqual(calls.variantUpdate, {
    where: { id: 'variant-1' },
    data: {
      sku: 'SKU-1',
      name: 'Premium',
      priceAmount: new Prisma.Decimal('13000.00'),
      currencyCode: 'ARS',
    },
  });
  assert.deepEqual(calls.inventoryUpdate, {
    where: { variantId: 'variant-1' },
    data: {
      availableQuantity: 8,
    },
  });
  assert.deepEqual(calls.imageDeleteMany, {
    where: { productId: 'product-1' },
  });
  assert.deepEqual(calls.imageCreateMany, {
    data: [
      {
        productId: 'product-1',
        assetUrl: 'https://cdn.example.com/mate-2.jpg',
        assetKey: 'mate-2.jpg',
        altText: 'Updated mate',
        sortOrder: 1,
      },
    ],
  });
});
