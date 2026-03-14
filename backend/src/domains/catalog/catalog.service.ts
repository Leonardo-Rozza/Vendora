import { Injectable } from '@nestjs/common';
import { Prisma, ProductCategory, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import {
  CatalogSortOption,
  DEFAULT_CATALOG_SORT,
  CATALOG_SORT_OPTIONS,
} from './catalog.constants';
import { CreateProductDto } from './dto/create-product.dto';
import { ListAdminProductsDto } from './dto/list-admin-products.dto';
import { ListCatalogProductsDto } from './dto/list-catalog-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type CatalogDbClient = Pick<PrismaService, 'product' | 'inventoryItem'>;

const PRODUCT_INCLUDE = {
  variants: {
    include: {
      inventoryItem: true,
    },
  },
  images: {
    orderBy: {
      sortOrder: 'asc' as const,
    },
  },
};

type CatalogListItem = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

type CatalogFilterMetadata = {
  categories: Array<{
    value: ProductCategory;
    count: number;
  }>;
  priceRange: {
    minAmount: string | null;
    maxAmount: string | null;
  };
  availableSorts: CatalogSortOption[];
  applied: {
    query: string | null;
    category: ProductCategory | null;
    minPriceAmount: string | null;
    maxPriceAmount: string | null;
    sort: CatalogSortOption;
  };
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: ListCatalogProductsDto) {
    const normalizedQuery = this.normalizeText(query.query);
    const appliedSort = query.sort ?? DEFAULT_CATALOG_SORT;
    const discoveryWhere = this.buildProductWhere({
      query: normalizedQuery,
      status: ProductStatus.ACTIVE,
    });
    const filteredWhere = this.buildProductWhere({
      query: normalizedQuery,
      status: ProductStatus.ACTIVE,
      category: query.category,
      minPriceAmount: query.minPriceAmount,
      maxPriceAmount: query.maxPriceAmount,
    });

    const [discoveryProducts, filteredProducts] = await Promise.all([
      this.prisma.product.findMany({
        where: discoveryWhere,
        include: {
          variants: {
            select: {
              priceAmount: true,
            },
          },
        },
      }),
      this.prisma.product.findMany({
        where: filteredWhere,
        include: PRODUCT_INCLUDE,
      }),
    ]);

    return {
      items: this.sortProducts(filteredProducts, appliedSort),
      filters: this.buildCatalogFilterMetadata({
        discoveryProducts,
        query,
        sort: appliedSort,
      }),
    };
  }

  findProductBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  listAdminProducts(query: ListAdminProductsDto) {
    return this.prisma.product.findMany({
      where: this.buildProductWhere(query),
      include: PRODUCT_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAdminProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
  }

  async createProduct(input: CreateProductDto) {
    return this.prisma.product.create({
        data: {
          slug: input.slug,
          name: input.name,
          description: input.description,
          status: input.status,
          category: input.category,
          variants: {
            create: input.variants.map((variant) => ({
            sku: variant.sku,
            name: variant.name,
            priceAmount: new Prisma.Decimal(variant.priceAmount),
            currencyCode: variant.currencyCode.toUpperCase(),
            inventoryItem:
              variant.availableQuantity !== undefined
                ? {
                    create: {
                      availableQuantity: variant.availableQuantity,
                    },
                  }
                : undefined,
          })),
        },
        images: input.images
          ? {
              create: input.images.map((image) => ({
                assetUrl: image.assetUrl,
                assetKey: image.assetKey,
                altText: image.altText,
                sortOrder: image.sortOrder,
              })),
            }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  async updateProduct(productId: string, input: UpdateProductDto) {
    return this.prisma.$transaction(async (client) => {
      const existing = await client.product.findUnique({
        where: { id: productId },
        include: {
          variants: true,
        },
      });

      if (!existing) {
        return null;
      }

      await client.product.update({
        where: { id: productId },
        data: {
          slug: input.slug,
          name: input.name,
          description: input.description,
          status: input.status,
          category: input.category,
        },
      });

      if (input.images) {
        await client.productImage.deleteMany({
          where: { productId },
        });

        if (input.images.length > 0) {
          await client.productImage.createMany({
            data: input.images.map((image) => ({
              productId,
              assetUrl: image.assetUrl,
              assetKey: image.assetKey,
              altText: image.altText,
              sortOrder: image.sortOrder,
            })),
          });
        }
      }

      if (input.variants) {
        for (const variant of input.variants) {
          if (variant.id) {
            const variantExists = existing.variants.some(
              (existingVariant) => existingVariant.id === variant.id,
            );

            if (!variantExists) {
              throw new Error(
                `Variant ${variant.id} does not belong to product ${productId}`,
              );
            }

            await client.productVariant.update({
              where: { id: variant.id },
              data: {
                sku: variant.sku,
                name: variant.name,
                priceAmount: new Prisma.Decimal(variant.priceAmount),
                currencyCode: variant.currencyCode.toUpperCase(),
              },
            });

            if (variant.availableQuantity !== undefined) {
              await this.upsertInventory(
                client,
                variant.id,
                variant.availableQuantity,
              );
            }

            continue;
          }

          const createdVariant = await client.productVariant.create({
            data: {
              productId,
              sku: variant.sku,
              name: variant.name,
              priceAmount: new Prisma.Decimal(variant.priceAmount),
              currencyCode: variant.currencyCode.toUpperCase(),
            },
          });

          if (variant.availableQuantity !== undefined) {
            await client.inventoryItem.create({
              data: {
                variantId: createdVariant.id,
                availableQuantity: variant.availableQuantity,
              },
            });
          }
        }
      }

      return this.findProductByIdWithClient(client, productId);
    });
  }

  private async findProductByIdWithClient(
    client: CatalogDbClient,
    productId: string,
  ) {
    return client.product.findUnique({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
  }

  private buildProductWhere({
    query,
    status,
    category,
    minPriceAmount,
    maxPriceAmount,
  }: {
    query?: string;
    status?: ProductStatus;
    category?: ProductCategory;
    minPriceAmount?: string;
    maxPriceAmount?: string;
  }) {
    const normalizedQuery = this.normalizeText(query);
    const andFilters: Prisma.ProductWhereInput[] = [];

    if (status) {
      andFilters.push({ status });
    }

    if (category) {
      andFilters.push({ category });
    }

    if (normalizedQuery) {
      andFilters.push({
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            slug: {
              contains: normalizedQuery,
              mode: 'insensitive' as const,
            },
          },
          {
            variants: {
              some: {
                sku: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ],
      });
    }

    const priceFilter = this.buildPriceFilter(minPriceAmount, maxPriceAmount);

    if (priceFilter) {
      andFilters.push({
        variants: {
          some: {
            priceAmount: priceFilter,
          },
        },
      });
    }

    if (andFilters.length === 0) {
      return {};
    }

    if (andFilters.length === 1) {
      return andFilters[0];
    }

    return {
      AND: andFilters,
    };
  }

  private buildCatalogFilterMetadata({
    discoveryProducts,
    query,
    sort,
  }: {
    discoveryProducts: Array<{
      category: ProductCategory | null;
      variants: Array<{
        priceAmount: Prisma.Decimal;
      }>;
    }>;
    query: ListCatalogProductsDto;
    sort: CatalogSortOption;
  }): CatalogFilterMetadata {
    const categoryCounts = new Map<ProductCategory, number>();
    const priceAmounts: number[] = [];

    for (const product of discoveryProducts) {
      if (product.category) {
        categoryCounts.set(
          product.category,
          (categoryCounts.get(product.category) ?? 0) + 1,
        );
      }

      for (const variant of product.variants) {
        priceAmounts.push(Number(variant.priceAmount.toString()));
      }
    }

    const minAmount = priceAmounts.length > 0 ? Math.min(...priceAmounts).toFixed(2) : null;
    const maxAmount = priceAmounts.length > 0 ? Math.max(...priceAmounts).toFixed(2) : null;

    return {
      categories: Array.from(categoryCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => left.value.localeCompare(right.value)),
      priceRange: {
        minAmount,
        maxAmount,
      },
      availableSorts: [...CATALOG_SORT_OPTIONS],
      applied: {
        query: this.normalizeText(query.query) ?? null,
        category: query.category ?? null,
        minPriceAmount: this.normalizeText(query.minPriceAmount) ?? null,
        maxPriceAmount: this.normalizeText(query.maxPriceAmount) ?? null,
        sort,
      },
    };
  }

  private buildPriceFilter(minPriceAmount?: string, maxPriceAmount?: string) {
    const min = this.normalizeDecimal(minPriceAmount);
    const max = this.normalizeDecimal(maxPriceAmount);

    if (!min && !max) {
      return undefined;
    }

    return {
      ...(min ? { gte: min } : {}),
      ...(max ? { lte: max } : {}),
    } satisfies Prisma.DecimalFilter;
  }

  private normalizeDecimal(value?: string) {
    const normalizedValue = this.normalizeText(value);

    if (!normalizedValue) {
      return undefined;
    }

    return new Prisma.Decimal(normalizedValue);
  }

  private normalizeText(value?: string | null) {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : undefined;
  }

  private sortProducts(products: CatalogListItem[], sort: CatalogSortOption) {
    const sortedProducts = [...products];

    if (sort === CatalogSortOption.PRICE_ASC || sort === CatalogSortOption.PRICE_DESC) {
      sortedProducts.sort((left, right) => {
        const difference = this.readLowestVariantPrice(left) - this.readLowestVariantPrice(right);

        return sort === CatalogSortOption.PRICE_ASC ? difference : difference * -1;
      });

      return sortedProducts;
    }

    sortedProducts.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    return sortedProducts;
  }

  private readLowestVariantPrice(product: CatalogListItem) {
    if (product.variants.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.min(
      ...product.variants.map((variant) => Number(variant.priceAmount.toString())),
    );
  }

  private async upsertInventory(
    client: CatalogDbClient,
    variantId: string,
    availableQuantity: number,
  ) {
    const existingInventory = await client.inventoryItem.findUnique({
      where: { variantId },
    });

    if (existingInventory) {
      await client.inventoryItem.update({
        where: { variantId },
        data: {
          availableQuantity,
        },
      });

      return;
    }

    await client.inventoryItem.create({
      data: {
        variantId,
        availableQuantity,
      },
    });
  }
}
