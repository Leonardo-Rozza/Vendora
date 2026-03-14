import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ConfigurationUnavailableError,
  type CapabilityStatus,
} from '../../../platform/config/app-config.service';
import { AppLoggerService } from '../../../platform/logging/app-logger.service';
import { EmailNotificationProvider } from './email-notification.provider';

test('EmailNotificationProvider skips delivery outside production when it is unconfigured', async () => {
  const provider = new EmailNotificationProvider(
    {
      environment: 'test',
      notificationEmailStatus: {
        configured: false,
        reason: 'Missing notification email credentials',
      } as CapabilityStatus,
    } as never,
    new AppLoggerService(),
  );

  const result = await provider.send({
    to: 'buyer@example.com',
    subject: 'Pedido confirmado',
    html: '<p>ok</p>',
  });

  assert.deepEqual(result, {
    status: 'skipped',
    provider: 'resend-compatible',
  });
});

test('EmailNotificationProvider fails fast in production when it is unconfigured', async () => {
  const provider = new EmailNotificationProvider(
    {
      environment: 'production',
      notificationEmailStatus: {
        configured: false,
        reason: 'Missing notification email credentials',
      } as CapabilityStatus,
    } as never,
    new AppLoggerService(),
  );

  await assert.rejects(
    () =>
      provider.send({
        to: 'buyer@example.com',
        subject: 'Pedido confirmado',
        html: '<p>ok</p>',
      }),
    (error: unknown) =>
      error instanceof ConfigurationUnavailableError &&
      /notificationEmail is not configured/.test(error.message),
  );
});

test('EmailNotificationProvider posts a resend-compatible payload when configured', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];

  class TestProvider extends EmailNotificationProvider {
    protected override getFetchImplementation(): typeof fetch {
      return (async (url: string | URL | Request, init?: RequestInit) => {
        requests.push({ url: String(url), init });

        return new Response(JSON.stringify({ id: 'email-123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as typeof fetch;
    }
  }

  const provider = new TestProvider(
    {
      environment: 'development',
      notificationEmailStatus: { configured: true } as CapabilityStatus,
      requireNotificationEmailConfig: () => ({
        apiBaseUrl: 'https://api.resend.com',
        apiKey: 'notif-key',
        fromEmail: 'ops@vendora.local',
        fromName: 'Vendora',
        replyToEmail: 'ayuda@vendora.local',
      }),
    } as never,
    new AppLoggerService(),
  );

  const result = await provider.send({
    to: 'buyer@example.com',
    subject: 'Tu pedido esta en camino',
    html: '<p>Seguimiento listo</p>',
    tags: [{ name: 'orderId', value: 'order-1' }],
  });

  assert.equal(result.status, 'sent');
  assert.equal(result.providerMessageId, 'email-123');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://api.resend.com/emails');

  const headers = requests[0]?.init?.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer notif-key');

  const body = JSON.parse(String(requests[0]?.init?.body)) as {
    from: string;
    reply_to: string;
    to: string[];
    tags: Array<{ name: string; value: string }>;
  };

  assert.equal(body.from, 'Vendora <ops@vendora.local>');
  assert.equal(body.reply_to, 'ayuda@vendora.local');
  assert.deepEqual(body.to, ['buyer@example.com']);
  assert.deepEqual(body.tags, [{ name: 'orderId', value: 'order-1' }]);
});
