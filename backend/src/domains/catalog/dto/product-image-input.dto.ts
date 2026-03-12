import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class ProductImageInputDto {
  @IsUrl()
  assetUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assetKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
