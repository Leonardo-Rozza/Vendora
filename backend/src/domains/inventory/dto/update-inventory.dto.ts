import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableQuantity!: number;
}
