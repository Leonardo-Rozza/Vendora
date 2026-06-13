import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CatalogService } from './catalog.service';
import { CategoriesService } from './categories.service';
import { ListCatalogProductsDto } from './dto/list-catalog-products.dto';

type ProductAttributeLink = {
  attributeValue: {
    value: string;
    slug: string;
    attribute: { id: string; name: string; slug: string };
  };
};

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly categoriesService: CategoriesService,
    private readonly attributesService: AttributesService,
  ) {}

  @Get('categories')
  listCategories() {
    return this.categoriesService.getTree();
  }

  @Get('attributes')
  listAttributes() {
    return this.attributesService.listAll();
  }

  @Get('products')
  async listProducts(@Query() query: ListCatalogProductsDto) {
    const { items, filters, pagination } =
      await this.catalogService.listProducts(query);

    return {
      items: items.map((product) => this.mapStorefrontProduct(product)),
      filters,
      pagination,
    };
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.catalogService.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product ${slug} was not found`);
    }

    return this.mapStorefrontProduct(product);
  }

  private mapStorefrontProduct(product: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    status: string;
    category: { id: string; name: string; slug: string } | null;
    attributeValues: ProductAttributeLink[];
    variants: Array<{
      id: string;
      sku: string;
      name: string;
      priceAmount: { toString(): string };
      currencyCode: string;
      inventoryItem?: {
        availableQuantity: number;
      } | null;
    }>;
    images: Array<{
      id: string;
      assetUrl: string;
      assetKey: string | null;
      altText: string | null;
      sortOrder: number;
    }>;
  }) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      status: product.status,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      attributes: product.attributeValues.map((link) => ({
        attributeId: link.attributeValue.attribute.id,
        attributeName: link.attributeValue.attribute.name,
        attributeSlug: link.attributeValue.attribute.slug,
        value: link.attributeValue.value,
        valueSlug: link.attributeValue.slug,
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        priceAmount: variant.priceAmount.toString(),
        currencyCode: variant.currencyCode,
        availableQuantity: variant.inventoryItem?.availableQuantity,
      })),
      images: product.images.map((image) => ({
        id: image.id,
        assetUrl: image.assetUrl,
        assetKey: image.assetKey,
        altText: image.altText,
        sortOrder: image.sortOrder,
      })),
    };
  }
}
