import { Prisma } from '@prisma/client';
import { CatalogService } from './catalog.service';

const HOGAR = {
  id: 'cat_hogar',
  name: 'Hogar',
  slug: 'hogar',
  parentId: null,
  sortOrder: 1,
};

const categoriesStub = (categories: Array<typeof HOGAR> = []) =>
  ({ listAll: async () => categories }) as never;

const PRODUCT_INCLUDE = {
  category: true,
  attributeValues: {
    include: { attributeValue: { include: { attribute: true } } },
  },
  variants: { include: { inventoryItem: true } },
  images: { orderBy: { sortOrder: 'asc' } },
};

const DISCOVERY_INCLUDE = {
  variants: { select: { priceAmount: true } },
  attributeValues: {
    include: { attributeValue: { include: { attribute: true } } },
  },
};

test('CatalogService lists products with category/attribute facets, search and pagination', async () => {
  let receivedArgs: unknown;
  let metadataArgs: unknown;
  const service = new CatalogService(
    {
      product: {
        findMany: async (args: unknown) => {
          if (!metadataArgs) {
            metadataArgs = args;
            return [
              {
                categoryId: 'cat_hogar',
                variants: [{ priceAmount: new Prisma.Decimal('9900.00') }],
                attributeValues: [
                  {
                    attributeValue: {
                      id: 'av_negro',
                      value: 'Negro',
                      slug: 'negro',
                      attribute: {
                        id: 'attr_color',
                        name: 'Color',
                        slug: 'color',
                      },
                    },
                  },
                ],
              },
            ];
          }

          receivedArgs = args;
          return [
            {
              id: 'product-1',
              createdAt: new Date('2026-03-14T00:00:00.000Z'),
              variants: [{ priceAmount: new Prisma.Decimal('9900.00') }],
            },
          ];
        },
      },
    } as never,
    categoriesStub([HOGAR]),
  );

  const result = await service.listProducts({
    query: 'mate',
    category: 'hogar',
    attributes: 'color:negro',
    minPriceAmount: '9000',
    maxPriceAmount: '12000',
    sort: 'price-asc',
  });

  expect(result.items).toEqual([
    {
      id: 'product-1',
      createdAt: new Date('2026-03-14T00:00:00.000Z'),
      variants: [{ priceAmount: new Prisma.Decimal('9900.00') }],
    },
  ]);
  expect(result.pagination).toEqual({
    page: 1,
    pageSize: 12,
    total: 1,
    totalPages: 1,
  });
  expect(result.filters.categories).toEqual([
    { id: 'cat_hogar', name: 'Hogar', slug: 'hogar', parentId: null, count: 1 },
  ]);
  expect(result.filters.attributes).toEqual([
    {
      id: 'attr_color',
      name: 'Color',
      slug: 'color',
      values: [{ id: 'av_negro', value: 'Negro', slug: 'negro', count: 1 }],
    },
  ]);
  expect(result.filters.applied).toEqual({
    query: 'mate',
    category: 'hogar',
    attributes: [{ slug: 'color', values: ['negro'] }],
    minPriceAmount: '9000',
    maxPriceAmount: '12000',
    sort: 'price-asc',
  });

  expect((metadataArgs as { include: unknown }).include).toEqual(
    DISCOVERY_INCLUDE,
  );
  expect(receivedArgs).toEqual({
    where: {
      AND: [
        { status: 'ACTIVE' },
        { categoryId: { in: ['cat_hogar'] } },
        {
          attributeValues: {
            some: {
              attributeValue: {
                attribute: { slug: 'color' },
                slug: { in: ['negro'] },
              },
            },
          },
        },
        {
          OR: [
            { name: { contains: 'mate', mode: 'insensitive' } },
            { slug: { contains: 'mate', mode: 'insensitive' } },
            { description: { contains: 'mate', mode: 'insensitive' } },
            {
              variants: {
                some: { sku: { contains: 'mate', mode: 'insensitive' } },
              },
            },
          ],
        },
        {
          variants: {
            some: {
              priceAmount: {
                gte: new Prisma.Decimal('9000'),
                lte: new Prisma.Decimal('12000'),
              },
            },
          },
        },
      ],
    },
    include: PRODUCT_INCLUDE,
  });
});

test('CatalogService returns an empty collection when no active products match the search', async () => {
  let readCount = 0;
  const service = new CatalogService(
    {
      product: {
        findMany: async () => {
          readCount += 1;
          return [];
        },
      },
    } as never,
    categoriesStub([]),
  );

  const result = await service.listProducts({ query: 'missing' });

  expect(readCount).toBe(2);
  expect(result.items).toEqual([]);
  expect(result.pagination).toEqual({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  expect(result.filters.categories).toEqual([]);
  expect(result.filters.attributes).toEqual([]);
  expect(result.filters.applied).toEqual({
    query: 'missing',
    category: null,
    attributes: [],
    minPriceAmount: null,
    maxPriceAmount: null,
    sort: 'featured',
  });
});

test('CatalogService loads an active product aggregate by slug', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService(
    {
      product: {
        findFirst: async (args: unknown) => {
          receivedArgs = args;
          return { id: 'product-1' };
        },
      },
    } as never,
    categoriesStub(),
  );

  const result = await service.findProductBySlug('mate-gourd');

  expect(result).toEqual({ id: 'product-1' });
  expect(receivedArgs).toEqual({
    where: { slug: 'mate-gourd', status: 'ACTIVE' },
    include: PRODUCT_INCLUDE,
  });
});

test('CatalogService creates a product with category, variants, inventory, and images', async () => {
  let receivedArgs: unknown;
  const service = new CatalogService(
    {
      product: {
        create: async (args: unknown) => {
          receivedArgs = args;
          return { id: 'product-1' };
        },
      },
    } as never,
    categoriesStub(),
  );

  const result = await service.createProduct({
    slug: 'mate-gourd',
    name: 'Mate Gourd',
    description: 'Classic mate.',
    status: 'ACTIVE',
    categoryId: 'cat_hogar',
    attributeValueIds: ['av_negro'],
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

  expect(result).toEqual({ id: 'product-1' });
  const createArgs = receivedArgs as {
    data: {
      categoryId: string;
      attributeValues: { create: Array<{ attributeValueId: string }> };
      variants: {
        create: Array<{ priceAmount: Prisma.Decimal; currencyCode: string }>;
      };
    };
  };
  expect(createArgs.data.categoryId).toBe('cat_hogar');
  expect(createArgs.data.attributeValues.create).toEqual([
    { attributeValueId: 'av_negro' },
  ]);
  expect(createArgs.data.variants.create[0]?.currencyCode).toBe('ARS');
  expect(createArgs.data.variants.create[0]?.priceAmount.toString()).toBe(
    '12500',
  );
});

test('CatalogService updates product fields, attribute links and existing variants', async () => {
  const calls: Record<string, unknown> = {};
  let readCount = 0;
  const service = new CatalogService(
    {
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

              return { id: 'product-1', variants: [], images: [] };
            },
            update: async (args: unknown) => {
              calls.productUpdate = args;
              return args;
            },
          },
          productAttributeValue: {
            deleteMany: async (args: unknown) => {
              calls.attributeDeleteMany = args;
              return args;
            },
            createMany: async (args: unknown) => {
              calls.attributeCreateMany = args;
              return args;
            },
          },
          productImage: {
            deleteMany: async () => undefined,
            createMany: async () => undefined,
          },
          productVariant: {
            update: async (args: unknown) => {
              calls.variantUpdate = args;
              return args;
            },
            create: async () => ({ id: 'variant-2' }),
          },
          inventoryItem: {
            findUnique: async () => ({ variantId: 'variant-1' }),
            update: async () => undefined,
            create: async () => undefined,
          },
        }),
    } as never,
    categoriesStub(),
  );

  await service.updateProduct('product-1', {
    name: 'Updated Mate Gourd',
    categoryId: 'cat_accesorios',
    attributeValueIds: ['av_azul'],
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
  });

  expect(calls.productUpdate).toEqual({
    where: { id: 'product-1' },
    data: {
      slug: undefined,
      name: 'Updated Mate Gourd',
      description: undefined,
      status: undefined,
      categoryId: 'cat_accesorios',
    },
  });
  expect(calls.attributeDeleteMany).toEqual({
    where: { productId: 'product-1' },
  });
  expect(calls.attributeCreateMany).toEqual({
    data: [{ productId: 'product-1', attributeValueId: 'av_azul' }],
  });
  expect(calls.variantUpdate).toEqual({
    where: { id: 'variant-1' },
    data: {
      sku: 'SKU-1',
      name: 'Premium',
      priceAmount: new Prisma.Decimal('13000.00'),
      currencyCode: 'ARS',
    },
  });
});

test('CatalogService finds related active products in the same category', async () => {
  const calls: Record<string, unknown> = {};
  const service = new CatalogService(
    {
      product: {
        findFirst: async () => ({ id: 'product-1', categoryId: 'cat_hogar' }),
        findMany: async (args: unknown) => {
          calls.findMany = args;
          return [{ id: 'product-2' }];
        },
      },
    } as never,
    categoriesStub(),
  );

  const result = await service.findRelatedProducts('mate-gourd');

  expect(result).toEqual([{ id: 'product-2' }]);
  expect(calls.findMany).toEqual({
    where: {
      status: 'ACTIVE',
      categoryId: 'cat_hogar',
      id: { not: 'product-1' },
    },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
});

test('CatalogService returns no related products without a category', async () => {
  const service = new CatalogService(
    {
      product: {
        findFirst: async () => ({ id: 'product-1', categoryId: null }),
      },
    } as never,
    categoriesStub(),
  );

  expect(await service.findRelatedProducts('mate-gourd')).toEqual([]);
});
