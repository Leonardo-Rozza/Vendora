import { IsString } from 'class-validator';

export class CreateProductImageUploadSignatureDto {
  @IsString()
  productId!: string;
}
