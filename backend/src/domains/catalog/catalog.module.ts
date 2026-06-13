import { Module } from '@nestjs/common';
import { AdminCatalogController } from './admin-catalog.controller';
import { CatalogController } from './catalog.controller';
import { AttributesService } from './attributes.service';
import { CatalogService } from './catalog.service';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CatalogController, AdminCatalogController],
  providers: [CatalogService, CategoriesService, AttributesService],
  exports: [CatalogService, CategoriesService, AttributesService],
})
export class CatalogModule {}
