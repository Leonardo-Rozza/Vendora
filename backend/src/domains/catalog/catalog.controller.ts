import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.catalogService.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException(`Product ${slug} was not found`);
    }

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
