import {
  createOrderTrackingToken,
  createTrackingCode,
  hashOrderTrackingToken,
} from './tracking-token';

test('tracking token helpers create deterministic hash and buyer-safe code', () => {
  const result = createOrderTrackingToken(Buffer.from('vendora-tracking-seed'));

  expect(result.token).toBe('dmVuZG9yYS10cmFja2luZy1zZWVk');
  expect(result.tokenHash).toBe(
    '7a509fba22efd2480918421f0c0a49373aa7d636d198fa0112035de4763473e1',
  );
  expect(result.trackingCode).toBe('VEN-7A50-9FBA-22EF');
});

test('tracking token hashing trims surrounding whitespace without changing case', () => {
  expect(hashOrderTrackingToken(' buyer-token ')).toBe(
    hashOrderTrackingToken('buyer-token'),
  );
  expect(hashOrderTrackingToken('buyer-token')).not.toBe(
    hashOrderTrackingToken('BUYER-token'),
  );
});

test('tracking code formatter pads short hashes predictably', () => {
  expect(createTrackingCode('abc123')).toBe('VEN-ABC1-2300-0000');
});
