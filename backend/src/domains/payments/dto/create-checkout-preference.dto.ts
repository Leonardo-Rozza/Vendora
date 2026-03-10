import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutPreferenceDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;
}
