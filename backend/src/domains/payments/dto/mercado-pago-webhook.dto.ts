import { IsIn, IsOptional, IsString } from 'class-validator';

const WEBHOOK_STATUSES = [
  'approved',
  'authorized',
  'pending',
  'rejected',
  'cancelled',
  'refunded',
] as const;

export class MercadoPagoWebhookDto {
  @IsString()
  eventId!: string;

  @IsString()
  resourceId!: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  @IsIn(WEBHOOK_STATUSES)
  status?: (typeof WEBHOOK_STATUSES)[number];
}
