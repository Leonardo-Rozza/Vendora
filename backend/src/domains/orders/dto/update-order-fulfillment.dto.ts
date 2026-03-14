import { FulfillmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderFulfillmentDto {
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus!: FulfillmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fulfillmentNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deliveryReference?: string;
}
