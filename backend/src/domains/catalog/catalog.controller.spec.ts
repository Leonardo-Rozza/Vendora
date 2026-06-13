import { NotFoundException } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

const HOGAR_FACET = {
  id: 'cat_hogar',
  name: 'Hogar',
  slug: 'hogar',
  parentId: null,
  count: 1,
};

const categoryRelation = {
  id: 'cat_hogar',
  name: 'Hogar',
  slug: 'hogar',
  parentId: null,
  sortOrder: 1,
};

const categorySummary = { id: 'cat_hogar', name: 'Hogar', slug: 'hogar' };

const noopCategoriesService = { getTree: async () => [] } as never;

test('CatalogController lists storefront-safe active products with filter metadata', async () => {
  const controller = new CatalogController(
    {
      listProducts: async () => ({
        items: [
          {
            id: 'product-1',
            slug: 'mate-gourd',
            name: 'Mate Gourd',
            description: 'Classic mate.',
            status: 'ACTIVE',
            category: categoryRelation,
            variants: [
              {
                id: 'variant-1',
                sku: 'SKU-1',
                name: 'Standard',
                priceAmount: {
                  toString: () => '12500.00',
                },
                currencyCode: 'ARS',
                inventoryItem: {
                  availableQuantity: 5,
                },
              },
            ],
            images: [
              {
                id: 'image-1',
                assetUrl: 'https://cdn.example.com/mate.jpg',
                assetKey: 'mate.jpg',
                altText: 'Mate gourd',
                sortOrder: 0,
              },
            ],
          },
        ],
        filters: {
          categories: [HOGAR_FACET],
          priceRange: { minAmount: '12500.00', maxAmount: '12500.00' },
          availableSorts: ['featured', 'price-asc', 'price-desc', 'newest'],
          applied: {
            query: 'mate',
            category: 'hogar',
            minPriceAmount: null,
            maxPriceAmount: null,
            sort: 'featured',
          },
        },
      }),
    } as never,
    noopCategoriesService,
  );

  const result = await controller.listProducts({ query: 'mate' });

  expect(result).toEqual({
    items: [
      {
        id: 'product-1',
        slug: 'mate-gourd',
        name: 'Mate Gourd',
        description: 'Classic mate.',
        status: 'ACTIVE',
        category: categorySummary,
        variants: [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: '12500.00',
            currencyCode: 'ARS',
            availableQuantity: 5,
          },
        ],
        images: [
          {
            id: 'image-1',
            assetUrl: 'https://cdn.example.com/mate.jpg',
            assetKey: 'mate.jpg',
            altText: 'Mate gourd',
            sortOrder: 0,
          },
        ],
      },
    ],
    filters: {
      categories: [HOGAR_FACET],
      priceRange: { minAmount: '12500.00', maxAmount: '12500.00' },
      availableSorts: ['featured', 'price-asc', 'price-desc', 'newest'],
      applied: {
        query: 'mate',
        category: 'hogar',
        minPriceAmount: null,
        maxPriceAmount: null,
        sort: 'featured',
      },
    },
  });
});

test('CatalogController returns a storefront-safe product contract', async () => {
  const controller = new CatalogController(
    {
      findProductBySlug: async () => ({
        id: 'product-1',
        slug: 'mate-gourd',
        name: 'Mate Gourd',
        description: 'Classic mate.',
        status: 'ACTIVE',
        category: categoryRelation,
        variants: [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: {
              toString: () => '12500.00',
            },
            currencyCode: 'ARS',
            inventoryItem: {
              availableQuantity: 5,
            },
          },
        ],
        images: [
          {
            id: 'image-1',
            assetUrl: 'https://cdn.example.com/mate.jpg',
            assetKey: 'mate.jpg',
            altText: 'Mate gourd',
            sortOrder: 0,
          },
        ],
      }),
    } as never,
    noopCategoriesService,
  );

  const result = await controller.getProductBySlug('mate-gourd');

  expect(result).toEqual({
    id: 'product-1',
    slug: 'mate-gourd',
    name: 'Mate Gourd',
    description: 'Classic mate.',
    status: 'ACTIVE',
    category: categorySummary,
    variants: [
      {
        id: 'variant-1',
        sku: 'SKU-1',
        name: 'Standard',
        priceAmount: '12500.00',
        currencyCode: 'ARS',
        availableQuantity: 5,
      },
    ],
    images: [
      {
        id: 'image-1',
        assetUrl: 'https://cdn.example.com/mate.jpg',
        assetKey: 'mate.jpg',
        altText: 'Mate gourd',
        sortOrder: 0,
      },
    ],
  });
});

test('CatalogController exposes the category tree', async () => {
  const tree = [
    {
      id: 'cat_hogar',
      name: 'Hogar',
      slug: 'hogar',
      parentId: null,
      sortOrder: 1,
      children: [],
    },
  ];
  const controller = new CatalogController(
    {} as never,
    {
      getTree: async () => tree,
    } as never,
  );

  expect(await controller.listCategories()).toEqual(tree);
});

test('CatalogController rejects missing products', async () => {
  const controller = new CatalogController(
    {
      findProductBySlug: async () => null,
    } as never,
    noopCategoriesService,
  );

  await expect(
    controller.getProductBySlug('missing-product'),
  ).rejects.toBeInstanceOf(NotFoundException);
  await expect(controller.getProductBySlug('missing-product')).rejects.toThrow(
    'Product missing-product was not found',
  );
});
