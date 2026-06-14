import { AppConfigService } from './app-config.service';

function buildConfig(
  env: Record<string, string | undefined>,
): AppConfigService {
  return new AppConfigService({
    get: <T>(key: string): T | undefined => env[key] as T | undefined,
  } as never);
}

test('isAllowedFrontendOrigin trusts only the configured allowlist', () => {
  const config = buildConfig({
    NODE_ENV: 'production',
    FRONTEND_APP_URL: 'https://shop.vendora.com, https://admin.vendora.com',
  });

  expect(config.isAllowedFrontendOrigin('https://shop.vendora.com')).toBe(true);
  expect(config.isAllowedFrontendOrigin('https://admin.vendora.com')).toBe(
    true,
  );
  // A wildcard preview from another account must NOT be trusted anymore.
  expect(config.isAllowedFrontendOrigin('https://evil.vercel.app')).toBe(false);
  expect(
    config.isAllowedFrontendOrigin('https://shop.vendora.com.evil.com'),
  ).toBe(false);
});

test('isAllowedFrontendOrigin denies all cross-origin requests when unconfigured in production', () => {
  const config = buildConfig({ NODE_ENV: 'production' });

  expect(config.isAllowedFrontendOrigin('https://anything.com')).toBe(false);
  // Non-browser clients (no Origin header) remain allowed.
  expect(config.isAllowedFrontendOrigin(undefined)).toBe(true);
});

test('isAllowedFrontendOrigin stays permissive in development', () => {
  const config = buildConfig({ NODE_ENV: 'development' });

  expect(config.isAllowedFrontendOrigin('http://localhost:3000')).toBe(true);
});

test('isAllowedMutationOrigin requires an allowlisted Origin for mutations in production', () => {
  const config = buildConfig({
    NODE_ENV: 'production',
    FRONTEND_APP_URL: 'https://shop.vendora.com',
  });

  expect(config.isAllowedMutationOrigin('https://shop.vendora.com')).toBe(true);
  expect(config.isAllowedMutationOrigin('https://evil.com')).toBe(false);
  // A missing Origin on a state-changing request is rejected in production.
  expect(config.isAllowedMutationOrigin(undefined)).toBe(false);
});

test('isAllowedMutationOrigin tolerates a missing Origin outside production', () => {
  const config = buildConfig({ NODE_ENV: 'test' });

  expect(config.isAllowedMutationOrigin(undefined)).toBe(true);
});

test('orderPendingTtlMinutes defaults to 60 and reads a valid override', () => {
  expect(buildConfig({}).orderPendingTtlMinutes).toBe(60);
  expect(
    buildConfig({ ORDER_PENDING_TTL_MINUTES: '120' }).orderPendingTtlMinutes,
  ).toBe(120);
});

test('orderPendingTtlMinutes falls back to 60 for invalid values', () => {
  expect(
    buildConfig({ ORDER_PENDING_TTL_MINUTES: '0' }).orderPendingTtlMinutes,
  ).toBe(60);
  expect(
    buildConfig({ ORDER_PENDING_TTL_MINUTES: 'abc' }).orderPendingTtlMinutes,
  ).toBe(60);
});
