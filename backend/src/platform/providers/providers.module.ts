import { Global, Module } from '@nestjs/common';
import { CloudinarySigningProvider } from './cloudinary/cloudinary-signing.provider';
import { MercadoPagoCheckoutProvider } from './mercado-pago/mercado-pago-checkout.provider';

@Global()
@Module({
  providers: [MercadoPagoCheckoutProvider, CloudinarySigningProvider],
  exports: [MercadoPagoCheckoutProvider, CloudinarySigningProvider],
})
export class ProvidersModule {}
