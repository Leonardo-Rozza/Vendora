import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListAdminProductsDto } from './dto/list-admin-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  listProducts(@Query() query: ListAdminProductsDto) {
    return this.catalogService.listAdminProducts(query);
  }

  @Get('products/:productId')
  async getProduct(@Param('productId') productId: string) {
    const product = await this.catalogService.findAdminProductById(productId);

    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found`);
    }

    return product;
  }

  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
    return this.catalogService.createProduct(body);
  }

  @Patch('products/:productId')
  async updateProduct(
    @Param('productId') productId: string,
    @Body() body: UpdateProductDto,
  ) {
    const product = await this.catalogService.updateProduct(productId, body);

    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found`);
    }

    return product;
  }
}
