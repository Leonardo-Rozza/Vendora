import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListCatalogProductsDto } from './dto/list-catalog-products.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  async listProducts(@Query() query: ListCatalogProductsDto) {
    const products = await this.catalogService.listProducts(query);

    return products.map((product) => this.mapStorefrontProduct(product));
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
    variants: Array<{
      id: string;
      sku: string;
      name: string;
      priceAmount: { toString(): string };
      currencyCode: string;
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
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        priceAmount: variant.priceAmount.toString(),
        currencyCode: variant.currencyCode,
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
