import { IsOptional, IsString } from 'class-validator';

/**
 * Mercado Pago webhook payload. Note there is intentionally NO `status` field:
 * the webhook never trusts a status sent in the request body. The authoritative
 * status is fetched from Mercado Pago via the gateway using `resourceId`.
 */
export class MercadoPagoWebhookDto {
  @IsString()
  eventId!: string;

  @IsString()
  resourceId!: string;

  @IsOptional()
  @IsString()
  topic?: string;
}
