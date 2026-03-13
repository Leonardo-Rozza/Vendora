import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDefined,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  variantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  userId?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => OrderContactDto)
  contact!: OrderContactDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}

export class OrderContactDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;
}

export class ShippingAddressDto {
  @IsString()
  @MaxLength(160)
  recipientName!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MaxLength(160)
  streetLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  streetLine2?: string;

  @IsString()
  @MaxLength(120)
  locality!: string;

  @IsString()
  @MaxLength(120)
  province!: string;

  @IsString()
  @MaxLength(24)
  postalCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNotes?: string;
}
