import { Body, Controller, Post } from '@nestjs/common';
import { CreateCheckoutPreferenceDto } from './dto/create-checkout-preference.dto';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout-preferences')
  createCheckoutPreference(@Body() body: CreateCheckoutPreferenceDto) {
    return this.paymentsService.createCheckoutPreference(body);
  }

  @Post('webhooks/mercado-pago')
  handleMercadoPagoWebhook(@Body() body: MercadoPagoWebhookDto) {
    return this.paymentsService.handleMercadoPagoWebhook(body);
  }
}
