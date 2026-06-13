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

  /** Category slug; filtering includes the category and its descendants. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  category?: string;

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
