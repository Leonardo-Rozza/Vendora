import { Injectable } from '@nestjs/common';
import {
  AppConfigService,
  ConfigurationUnavailableError,
  type CapabilityStatus,
} from '../../../platform/config/app-config.service';
import { AppLoggerService } from '../../../platform/logging/app-logger.service';

export type SendEmailNotificationInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{
    name: string;
    value: string;
  }>;
};

export type SendEmailNotificationResult = {
  status: 'sent' | 'skipped';
  provider: 'resend-compatible';
  providerMessageId?: string;
};

type NotificationEmailConfig = ReturnType<
  AppConfigService['requireNotificationEmailConfig']
>;

@Injectable()
export class EmailNotificationProvider {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async send(
    input: SendEmailNotificationInput,
  ): Promise<SendEmailNotificationResult> {
    const status = this.appConfigService.notificationEmailStatus;

    if (!status.configured) {
      return this.handleMissingConfiguration(status, input);
    }

    const config = this.appConfigService.requireNotificationEmailConfig();
    const response = await this.getFetchImplementation()(
      this.resolveEndpoint(config),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          from: this.formatFrom(config),
          to: [input.to],
          subject: input.subject,
          html: input.html,
          ...(input.text ? { text: input.text } : {}),
          ...((input.replyTo ?? config.replyToEmail)
            ? { reply_to: input.replyTo ?? config.replyToEmail }
            : {}),
          ...(input.tags ? { tags: input.tags } : {}),
        }),
      },
    );

    const payload = (await this.readJson(response)) as {
      id?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.message ??
          `Notification email request failed with status ${response.status}`,
      );
    }

    return {
      status: 'sent',
      provider: 'resend-compatible',
      providerMessageId: payload.id,
    };
  }

  protected getFetchImplementation(): typeof fetch {
    return fetch;
  }

  private handleMissingConfiguration(
    status: CapabilityStatus,
    input: SendEmailNotificationInput,
  ): SendEmailNotificationResult {
    if (this.appConfigService.environment === 'production') {
      throw new ConfigurationUnavailableError(
        'notificationEmail',
        status.reason ?? 'Unknown reason',
      );
    }

    this.logger.logApplicationEvent('notification.email.skipped_unconfigured', {
      to: input.to,
      subject: input.subject,
      environment: this.appConfigService.environment,
    });

    return {
      status: 'skipped',
      provider: 'resend-compatible',
    };
  }

  private formatFrom(config: NotificationEmailConfig): string {
    return config.fromName
      ? `${config.fromName} <${config.fromEmail}>`
      : config.fromEmail;
  }

  private resolveEndpoint(config: NotificationEmailConfig): string {
    return `${config.apiBaseUrl.replace(/\/$/, '')}/emails`;
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  }
}
