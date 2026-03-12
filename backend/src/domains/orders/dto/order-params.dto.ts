import { IsString } from 'class-validator';

export class OrderParamsDto {
  @IsString()
  orderId!: string;
}
