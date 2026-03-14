import { createHash, randomBytes } from 'node:crypto';

const TRACKING_TOKEN_BYTES = 18;

export type OrderTrackingToken = {
  token: string;
  tokenHash: string;
  trackingCode: string;
};

export function createOrderTrackingToken(
  bytes: Buffer = randomBytes(TRACKING_TOKEN_BYTES),
): OrderTrackingToken {
  const token = bytes.toString('base64url');
  const tokenHash = hashOrderTrackingToken(token);

  return {
    token,
    tokenHash,
    trackingCode: createTrackingCode(tokenHash),
  };
}

export function hashOrderTrackingToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export function createTrackingCode(tokenHash: string): string {
  const normalizedHash = tokenHash.trim().toUpperCase();
  const code = normalizedHash.slice(0, 12).padEnd(12, '0');

  return `VEN-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}
