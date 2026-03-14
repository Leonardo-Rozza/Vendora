import { ProductCategory } from '@prisma/client';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CatalogSortOption } from '../catalog.constants';

export class ListCatalogProductsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsNumberString()
  minPriceAmount?: string;

  @IsOptional()
  @IsNumberString()
  maxPriceAmount?: string;

  @IsOptional()
  @IsEnum(CatalogSortOption)
  sort?: CatalogSortOption;
}
