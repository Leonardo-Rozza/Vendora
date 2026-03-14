import assert from 'node:assert/strict';
import test from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

test('CatalogController lists storefront-safe active products with filter metadata', async () => {
  const controller = new CatalogController({
    listProducts: async () => ({
      items: [
        {
          id: 'product-1',
          slug: 'mate-gourd',
          name: 'Mate Gourd',
          description: 'Classic mate.',
          status: 'ACTIVE',
          category: 'HOGAR',
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
        categories: [{ value: 'HOGAR', count: 1 }],
        priceRange: { minAmount: '12500.00', maxAmount: '12500.00' },
        availableSorts: ['featured', 'price-asc', 'price-desc', 'newest'],
        applied: {
          query: 'mate',
          category: 'HOGAR',
          minPriceAmount: null,
          maxPriceAmount: null,
          sort: 'featured',
        },
      },
    }),
  } as never);

  const result = await controller.listProducts({ query: 'mate' });

  assert.deepEqual(result, {
    items: [
      {
        id: 'product-1',
        slug: 'mate-gourd',
        name: 'Mate Gourd',
        description: 'Classic mate.',
        status: 'ACTIVE',
        category: 'HOGAR',
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
      categories: [{ value: 'HOGAR', count: 1 }],
      priceRange: { minAmount: '12500.00', maxAmount: '12500.00' },
      availableSorts: ['featured', 'price-asc', 'price-desc', 'newest'],
      applied: {
        query: 'mate',
        category: 'HOGAR',
        minPriceAmount: null,
        maxPriceAmount: null,
        sort: 'featured',
      },
    },
  });
});

test('CatalogController returns a storefront-safe product contract', async () => {
  const controller = new CatalogController({
    findProductBySlug: async () => ({
      id: 'product-1',
      slug: 'mate-gourd',
      name: 'Mate Gourd',
      description: 'Classic mate.',
      status: 'ACTIVE',
      category: 'HOGAR',
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
  } as never);

  const result = await controller.getProductBySlug('mate-gourd');

  assert.deepEqual(result, {
    id: 'product-1',
    slug: 'mate-gourd',
    name: 'Mate Gourd',
    description: 'Classic mate.',
    status: 'ACTIVE',
    category: 'HOGAR',
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

test('CatalogController rejects missing products', async () => {
  const controller = new CatalogController({
    findProductBySlug: async () => null,
  } as never);

  await assert.rejects(
    () => controller.getProductBySlug('missing-product'),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, 'Product missing-product was not found');
      return true;
    },
  );
});
