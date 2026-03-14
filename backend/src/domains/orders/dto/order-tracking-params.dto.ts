import { IsString, MinLength } from 'class-validator';

export class OrderTrackingParamsDto {
  @IsString()
  @MinLength(12)
  trackingToken!: string;
}
