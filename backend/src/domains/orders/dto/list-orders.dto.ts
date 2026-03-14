import { FulfillmentStatus, OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;
}
