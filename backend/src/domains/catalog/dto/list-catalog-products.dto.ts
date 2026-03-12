import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListCatalogProductsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;
}
