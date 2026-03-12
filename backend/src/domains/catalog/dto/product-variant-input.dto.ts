import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

export class ProductVariantInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(64)
  sku!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(DECIMAL_PATTERN)
  priceAmount!: string;

  @IsString()
  @Length(3, 3)
  currencyCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableQuantity?: number;
}
