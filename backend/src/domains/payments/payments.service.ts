import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

const MERCADO_PAGO_PROVIDER = 'mercado-pago';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderPaymentId(providerPaymentId: string) {
    return this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        providerPaymentId,
      },
      include: {
        order: true,
        webhookDeliveries: true,
      },
    });
  }
}
