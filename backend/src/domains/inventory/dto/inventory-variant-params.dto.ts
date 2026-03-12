import { IsString } from 'class-validator';

export class InventoryVariantParamsDto {
  @IsString()
  variantId!: string;
}
