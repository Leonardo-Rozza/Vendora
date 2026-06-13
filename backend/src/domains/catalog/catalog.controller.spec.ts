import { NotFoundException } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

const categoryRelation = {
  id: 'cat_hogar',
  name: 'Hogar',
  slug: 'hogar',
  parentId: null,
  sortOrder: 1,
};

const categorySummary = { id: 'cat_hogar', name: 'Hogar', slug: 'hogar' };

const attributeLinks = [
  {
    attributeValue: {
      value: 'Negro',
      slug: 'negro',
      attribute: { id: 'attr_color', name: 'Color', slug: 'color' },
    },
  },
];

const mappedAttributes = [
  {
    attributeId: 'attr_color',
    attributeName: 'Color',
    attributeSlug: 'color',
    value: 'Negro',
    valueSlug: 'negro',
  },
];

const productAggregate = {
  id: 'product-1',
  slug: 'mate-gourd',
  name: 'Mate Gourd',
  description: 'Classic mate.',
  status: 'ACTIVE',
  category: categoryRelation,
  attributeValues: attributeLinks,
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-1',
      name: 'Standard',
      priceAmount: { toString: () => '12500.00' },
      currencyCode: 'ARS',
      inventoryItem: { availableQuantity: 5 },
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
};

const mappedProduct = {
  id: 'product-1',
  slug: 'mate-gourd',
  name: 'Mate Gourd',
  description: 'Classic mate.',
  status: 'ACTIVE',
  category: categorySummary,
  attributes: mappedAttributes,
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
};

const noopCategoriesService = { getTree: async () => [] } as never;
const noopAttributesService = { listAll: async () => [] } as never;

test('CatalogController lists storefront-safe products with filters and pagination', async () => {
  const pagination = { page: 1, pageSize: 12, total: 1, totalPages: 1 };
  const filters = {
    categories: [],
    attributes: [],
    priceRange: { minAmount: null, maxAmount: null },
    availableSorts: ['featured', 'price-asc', 'price-desc', 'newest'],
    applied: {
      query: 'mate',
      category: null,
      attributes: [],
      minPriceAmount: null,
      maxPriceAmount: null,
      sort: 'featured',
    },
  };
  const controller = new CatalogController(
    {
      listProducts: async () => ({
        items: [productAggregate],
        filters,
        pagination,
      }),
    } as never,
    noopCategoriesService,
    noopAttributesService,
  );

  const result = await controller.listProducts({ query: 'mate' });

  expect(result).toEqual({
    items: [mappedProduct],
    filters,
    pagination,
  });
});

test('CatalogController returns a storefront-safe product contract', async () => {
  const controller = new CatalogController(
    {
      findProductBySlug: async () => productAggregate,
    } as never,
    noopCategoriesService,
    noopAttributesService,
  );

  expect(await controller.getProductBySlug('mate-gourd')).toEqual(
    mappedProduct,
  );
});

test('CatalogController exposes the category tree and attributes', async () => {
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
  const attributes = [
    { id: 'attr_color', name: 'Color', slug: 'color', values: [] },
  ];
  const controller = new CatalogController(
    {} as never,
    { getTree: async () => tree } as never,
    { listAll: async () => attributes } as never,
  );

  expect(await controller.listCategories()).toEqual(tree);
  expect(await controller.listAttributes()).toEqual(attributes);
});

test('CatalogController rejects missing products', async () => {
  const controller = new CatalogController(
    {
      findProductBySlug: async () => null,
    } as never,
    noopCategoriesService,
    noopAttributesService,
  );

  await expect(
    controller.getProductBySlug('missing-product'),
  ).rejects.toBeInstanceOf(NotFoundException);
  await expect(controller.getProductBySlug('missing-product')).rejects.toThrow(
    'Product missing-product was not found',
  );
});

test('CatalogController maps related products', async () => {
  const controller = new CatalogController(
    {
      findRelatedProducts: async () => [productAggregate],
    } as never,
    noopCategoriesService,
    noopAttributesService,
  );

  expect(await controller.getRelatedProducts('mate-gourd')).toEqual([
    mappedProduct,
  ]);
});
