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

type NotificationEmailConfig = {
  apiBaseUrl: string;
  apiKey: string;
  fromEmail: string;
  fromName: string | null;
  replyToEmail: string | null;
};

export class ConfigurationUnavailableError extends Error {
  constructor(capability: string, reason: string) {
    super(`${capability} is not configured: ${reason}`);
  }
}

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  private readonly allowedFrontendProtocols = ['http:', 'https:'] as const;

  get appName(): string {
    return this.getOrDefault('APP_NAME', 'vendora-backend');
  }

  get adminSessionCookieName(): string {
    return this.getOrDefault(
      'ADMIN_SESSION_COOKIE_NAME',
      'vendora_admin_session',
    );
  }

  get adminSessionCookieSameSite(): 'lax' | 'none' | 'strict' {
    const configuredValue = this.getOrDefault(
      'ADMIN_SESSION_COOKIE_SAME_SITE',
      this.environment === 'production' ? 'none' : 'lax',
    ).toLowerCase();

    if (
      configuredValue === 'lax' ||
      configuredValue === 'none' ||
      configuredValue === 'strict'
    ) {
      return configuredValue;
    }

    return this.environment === 'production' ? 'none' : 'lax';
  }

  get adminSessionSecret(): string {
    return this.getOrDefault(
      'ADMIN_SESSION_SECRET',
      'vendora-admin-session-dev-secret',
    );
  }

  get adminSessionTtlMs(): number {
    return (
      Number(this.getOrDefault('ADMIN_SESSION_TTL_HOURS', '12')) *
      60 *
      60 *
      1000
    );
  }

  get initialAdminEmail(): string | null {
    return this.configService.get<string>('ADMIN_INITIAL_EMAIL') ?? null;
  }

  get initialAdminPassword(): string | null {
    return this.configService.get<string>('ADMIN_INITIAL_PASSWORD') ?? null;
  }

  get environment(): RuntimeEnvironment {
    return this.getOrDefault('NODE_ENV', 'development') as RuntimeEnvironment;
  }

  get port(): number {
    return Number(this.getOrDefault('PORT', '3000'));
  }

  get frontendAppUrls(): string[] {
    const configuredValue = this.configService.get<string>('FRONTEND_APP_URL');

    if (!configuredValue) {
      return [];
    }

    return configuredValue
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => this.normalizeOrigin(value))
      .filter(
        (value, index, collection) => collection.indexOf(value) === index,
      );
  }

  get frontendAppUrl(): string | null {
    return this.frontendAppUrls[0] ?? null;
  }

  isAllowedFrontendOrigin(origin: string | undefined): boolean {
    if (!origin) {
      return true;
    }

    if (this.frontendAppUrls.length === 0) {
      return true;
    }

    try {
      const normalizedOrigin = this.normalizeOrigin(origin);
      return this.frontendAppUrls.includes(normalizedOrigin);
    } catch {
      return false;
    }
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

  get notificationEmailStatus(): CapabilityStatus {
    const apiKey = this.configService.get<string>('NOTIFICATION_EMAIL_API_KEY');
    const fromEmail = this.configService.get<string>('NOTIFICATION_EMAIL_FROM');

    if (!apiKey && !fromEmail) {
      return {
        configured: false,
        reason: 'Missing notification email credentials',
      };
    }

    if (!apiKey || !fromEmail) {
      return {
        configured: false,
        reason:
          'Notification email requires both NOTIFICATION_EMAIL_API_KEY and NOTIFICATION_EMAIL_FROM',
      };
    }

    return { configured: true };
  }

  getCapabilitySummary(): Record<string, CapabilityStatus> {
    return {
      database: this.databaseStatus,
      mercadoPago: this.mercadoPagoStatus,
      notificationEmail: this.notificationEmailStatus,
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

    return this.normalizeDatabaseUrl(
      this.configService.getOrThrow<string>('DATABASE_URL'),
    );
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

  requireNotificationEmailConfig(): NotificationEmailConfig {
    const status = this.notificationEmailStatus;

    if (!status.configured) {
      throw new ConfigurationUnavailableError(
        'notificationEmail',
        status.reason ?? 'Unknown reason',
      );
    }

    return {
      apiBaseUrl:
        this.configService.get<string>('NOTIFICATION_EMAIL_API_BASE_URL') ??
        'https://api.resend.com',
      apiKey: this.configService.getOrThrow<string>(
        'NOTIFICATION_EMAIL_API_KEY',
      ),
      fromEmail: this.configService.getOrThrow<string>(
        'NOTIFICATION_EMAIL_FROM',
      ),
      fromName:
        this.configService.get<string>('NOTIFICATION_EMAIL_FROM_NAME') ?? null,
      replyToEmail:
        this.configService.get<string>('NOTIFICATION_EMAIL_REPLY_TO') ?? null,
    };
  }

  private getOrDefault(key: string, fallback: string): string {
    return this.configService.get<string>(key) ?? fallback;
  }

  private normalizeOrigin(input: string): string {
    const url = new URL(input);

    if (
      !this.allowedFrontendProtocols.includes(
        url.protocol as (typeof this.allowedFrontendProtocols)[number],
      )
    ) {
      throw new Error(`Invalid frontend origin protocol: ${url.protocol}`);
    }

    return url.origin;
  }

  private normalizeDatabaseUrl(databaseUrl: string): string {
    try {
      const url = new URL(databaseUrl);

      if (!url.hostname.endsWith('.rlwy.net')) {
        return databaseUrl;
      }

      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }

      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '5');
      }

      return url.toString();
    } catch {
      return databaseUrl;
    }
  }
}
