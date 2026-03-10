import { ConsoleLogger, Injectable } from '@nestjs/common';

type LogPayload = Record<string, unknown>;

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  constructor() {
    super('Vendora', {
      json: true,
      timestamp: true,
    });
  }

  logApplicationEvent(event: string, payload: LogPayload = {}): void {
    this.log(this.serialize(event, payload));
  }

  logOrderEvent(event: string, payload: LogPayload = {}): void {
    this.log(this.serialize(event, payload, 'order'));
  }

  logPaymentEvent(event: string, payload: LogPayload = {}): void {
    this.log(this.serialize(event, payload, 'payment'));
  }

  logWebhookEvent(event: string, payload: LogPayload = {}): void {
    this.log(this.serialize(event, payload, 'webhook'));
  }

  logApplicationError(
    event: string,
    error: Error,
    payload: LogPayload = {},
  ): void {
    this.error(
      this.serialize(event, {
        ...payload,
        errorMessage: error.message,
        errorName: error.name,
      }),
      error.stack,
    );
  }

  private serialize(
    event: string,
    payload: LogPayload,
    domain = 'application',
  ): string {
    return JSON.stringify({
      domain,
      event,
      ...payload,
    });
  }
}
