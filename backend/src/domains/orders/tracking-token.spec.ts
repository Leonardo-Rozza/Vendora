import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOrderTrackingToken,
  createTrackingCode,
  hashOrderTrackingToken,
} from './tracking-token';

test('tracking token helpers create deterministic hash and buyer-safe code', () => {
  const result = createOrderTrackingToken(Buffer.from('vendora-tracking-seed'));

  assert.equal(result.token, 'dmVuZG9yYS10cmFja2luZy1zZWVk');
  assert.equal(
    result.tokenHash,
    '8e6e29f314ce2abca2fcef791ef3cddc804ee8bbf2f5d4163af787087a370f68',
  );
  assert.equal(result.trackingCode, 'VEN-8E6E-29F3-14CE');
});

test('tracking token hashing trims surrounding whitespace without changing case', () => {
  assert.equal(
    hashOrderTrackingToken(' buyer-token '),
    hashOrderTrackingToken('buyer-token'),
  );
  assert.notEqual(
    hashOrderTrackingToken('buyer-token'),
    hashOrderTrackingToken('BUYER-token'),
  );
});

test('tracking code formatter pads short hashes predictably', () => {
  assert.equal(createTrackingCode('abc123'), 'VEN-ABC1-2300-0000');
});
