import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { CloudinarySigningProvider } from './cloudinary/cloudinary-signing.provider';
import { MERCADO_PAGO_GATEWAY } from './mercado-pago/mercado-pago.gateway';
import { MercadoPagoFakeGateway } from './mercado-pago/mercado-pago-fake.gateway';
import { MercadoPagoRealGateway } from './mercado-pago/mercado-pago-real.gateway';

const mercadoPagoGatewayProvider = {
  provide: MERCADO_PAGO_GATEWAY,
  inject: [AppConfigService],
  // Use the real SDK-backed gateway only when credentials are configured;
  // otherwise fall back to the local fake so development works "dry".
  useFactory: (appConfigService: AppConfigService) =>
    appConfigService.mercadoPagoStatus.configured
      ? new MercadoPagoRealGateway(appConfigService)
      : new MercadoPagoFakeGateway(appConfigService),
};

@Global()
@Module({
  providers: [mercadoPagoGatewayProvider, CloudinarySigningProvider],
  exports: [MERCADO_PAGO_GATEWAY, CloudinarySigningProvider],
})
export class ProvidersModule {}
