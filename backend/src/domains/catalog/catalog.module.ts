import { Module } from '@nestjs/common';
import { AdminCatalogController } from './admin-catalog.controller';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CatalogController, AdminCatalogController],
  providers: [CatalogService, CategoriesService],
  exports: [CatalogService, CategoriesService],
})
export class CatalogModule {}
