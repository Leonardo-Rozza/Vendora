import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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

  /** Attribute filter, e.g. `color:negro,azul;material:vidrio`. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attributes?: string;

  @IsOptional()
  @IsNumberString()
  minPriceAmount?: string;

  @IsOptional()
  @IsNumberString()
  maxPriceAmount?: string;

  @IsOptional()
  @IsEnum(CatalogSortOption)
  sort?: CatalogSortOption;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  pageSize?: number;
}
