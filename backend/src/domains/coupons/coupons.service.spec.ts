import { Prisma } from '@prisma/client';
import { computeCouponDiscount, evaluateCoupon } from './coupons.service';

const baseCoupon = {
  id: 'coupon-1',
  code: 'BIENVENIDA10',
  type: 'PERCENTAGE' as const,
  value: new Prisma.Decimal(10),
  minSubtotalAmount: null,
  maxRedemptions: null,
  timesRedeemed: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const now = new Date('2026-06-13T00:00:00.000Z');

test('computeCouponDiscount handles percentage and fixed, capped at subtotal', () => {
  expect(
    computeCouponDiscount(
      { type: 'PERCENTAGE', value: new Prisma.Decimal(10) },
      new Prisma.Decimal('1000'),
    ).toFixed(2),
  ).toBe('100.00');

  expect(
    computeCouponDiscount(
      { type: 'FIXED', value: new Prisma.Decimal(500) },
      new Prisma.Decimal('1000'),
    ).toFixed(2),
  ).toBe('500.00');

  expect(
    computeCouponDiscount(
      { type: 'FIXED', value: new Prisma.Decimal(2000) },
      new Prisma.Decimal('1000'),
    ).toFixed(2),
  ).toBe('1000.00');
});

test('evaluateCoupon accepts a valid coupon and returns the discount', () => {
  expect(evaluateCoupon(baseCoupon, new Prisma.Decimal('1000'), now)).toEqual({
    valid: true,
    code: 'BIENVENIDA10',
    type: 'PERCENTAGE',
    discountAmount: '100.00',
  });
});

test('evaluateCoupon rejects unknown or inactive coupons', () => {
  expect(evaluateCoupon(null, new Prisma.Decimal('1000'), now).valid).toBe(
    false,
  );
  expect(
    evaluateCoupon(
      { ...baseCoupon, isActive: false },
      new Prisma.Decimal('1000'),
      now,
    ).valid,
  ).toBe(false);
});

test('evaluateCoupon enforces the validity window', () => {
  expect(
    evaluateCoupon(
      { ...baseCoupon, startsAt: new Date('2026-07-01T00:00:00.000Z') },
      new Prisma.Decimal('1000'),
      now,
    ).valid,
  ).toBe(false);
  expect(
    evaluateCoupon(
      { ...baseCoupon, endsAt: new Date('2026-01-01T00:00:00.000Z') },
      new Prisma.Decimal('1000'),
      now,
    ).valid,
  ).toBe(false);
});

test('evaluateCoupon enforces minimum subtotal and redemption limits', () => {
  expect(
    evaluateCoupon(
      { ...baseCoupon, minSubtotalAmount: new Prisma.Decimal('2000') },
      new Prisma.Decimal('1000'),
      now,
    ).valid,
  ).toBe(false);
  expect(
    evaluateCoupon(
      { ...baseCoupon, maxRedemptions: 5, timesRedeemed: 5 },
      new Prisma.Decimal('1000'),
      now,
    ).valid,
  ).toBe(false);
});
