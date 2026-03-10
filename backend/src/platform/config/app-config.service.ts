import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RuntimeEnvironment = 'development' | 'test' | 'production';

export type CapabilityStatus = {
  configured: boolean;
  reason?: string;
};

type MercadoPagoConfig = {
  accessToken: string;
  webhookSecret: string;
};

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export class ConfigurationUnavailableError extends Error {
  constructor(capability: string, reason: string) {
    super(`${capability} is not configured: ${reason}`);
  }
}

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get appName(): string {
    return this.getOrDefault('APP_NAME', 'vendora-backend');
  }

  get environment(): RuntimeEnvironment {
    return this.getOrDefault('NODE_ENV', 'development') as RuntimeEnvironment;
  }

  get port(): number {
    return Number(this.getOrDefault('PORT', '3000'));
  }

  get frontendAppUrl(): string | null {
    return this.configService.get<string>('FRONTEND_APP_URL') ?? null;
  }

  get databaseStatus(): CapabilityStatus {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      return {
        configured: false,
        reason: 'Missing DATABASE_URL',
      };
    }

    return { configured: true };
  }

  get mercadoPagoStatus(): CapabilityStatus {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );
    const webhookSecret = this.configService.get<string>(
      'MERCADOPAGO_WEBHOOK_SECRET',
    );

    if (!accessToken && !webhookSecret) {
      return {
        configured: false,
        reason:
          'Missing MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
      };
    }

    if (!accessToken || !webhookSecret) {
      return {
        configured: false,
        reason:
          'Mercado Pago requires both MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
      };
    }

    return { configured: true };
  }

  get cloudinaryStatus(): CapabilityStatus {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName && !apiKey && !apiSecret) {
      return {
        configured: false,
        reason: 'Missing Cloudinary credentials',
      };
    }

    if (!cloudName || !apiKey || !apiSecret) {
      return {
        configured: false,
        reason:
          'Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
      };
    }

    return { configured: true };
  }

  getCapabilitySummary(): Record<string, CapabilityStatus> {
    return {
      database: this.databaseStatus,
      mercadoPago: this.mercadoPagoStatus,
      cloudinary: this.cloudinaryStatus,
    };
  }

  requireDatabaseUrl(): string {
    const status = this.databaseStatus;

    if (!status.configured) {
      throw new ConfigurationUnavailableError(
        'database',
        status.reason ?? 'Unknown reason',
      );
    }

    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  requireMercadoPagoConfig(): MercadoPagoConfig {
    const status = this.mercadoPagoStatus;

    if (!status.configured) {
      throw new ConfigurationUnavailableError(
        'mercadoPago',
        status.reason ?? 'Unknown reason',
      );
    }

    return {
      accessToken: this.configService.getOrThrow<string>(
        'MERCADOPAGO_ACCESS_TOKEN',
      ),
      webhookSecret: this.configService.getOrThrow<string>(
        'MERCADOPAGO_WEBHOOK_SECRET',
      ),
    };
  }

  requireCloudinaryConfig(): CloudinaryConfig {
    const status = this.cloudinaryStatus;

    if (!status.configured) {
      throw new ConfigurationUnavailableError(
        'cloudinary',
        status.reason ?? 'Unknown reason',
      );
    }

    return {
      cloudName: this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    };
  }

  private getOrDefault(key: string, fallback: string): string {
    return this.configService.get<string>(key) ?? fallback;
  }
}
