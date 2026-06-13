import { Injectable } from '@nestjs/common';
import { Coupon, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';

export type CouponEvaluation =
  | {
      valid: true;
      code: string;
      type: CouponType;
      discountAmount: string;
    }
  | { valid: false; reason: string };

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(
    code: string,
    subtotalAmount: Prisma.Decimal,
    now: Date = new Date(),
  ): Promise<CouponEvaluation> {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    return evaluateCoupon(coupon, subtotalAmount, now);
  }
}

/** Pure evaluation: validates the coupon and computes the discount. */
export function evaluateCoupon(
  coupon: Coupon | null,
  subtotalAmount: Prisma.Decimal,
  now: Date,
): CouponEvaluation {
  if (!coupon || !coupon.isActive) {
    return { valid: false, reason: 'Cupón inválido' };
  }

  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, reason: 'El cupón todavía no está vigente' };
  }

  if (coupon.endsAt && now > coupon.endsAt) {
    return { valid: false, reason: 'El cupón está vencido' };
  }

  if (
    coupon.maxRedemptions !== null &&
    coupon.timesRedeemed >= coupon.maxRedemptions
  ) {
    return { valid: false, reason: 'El cupón alcanzó su límite de usos' };
  }

  if (coupon.minSubtotalAmount && subtotalAmount.lt(coupon.minSubtotalAmount)) {
    return {
      valid: false,
      reason: `Requiere un subtotal mínimo de ${coupon.minSubtotalAmount.toFixed(2)}`,
    };
  }

  const discountAmount = computeCouponDiscount(coupon, subtotalAmount);

  if (discountAmount.lte(0)) {
    return { valid: false, reason: 'El cupón no aplica a este carrito' };
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discountAmount: discountAmount.toFixed(2),
  };
}

/** Discount amount (2dp), capped at the subtotal and never negative. */
export function computeCouponDiscount(
  coupon: Pick<Coupon, 'type' | 'value'>,
  subtotalAmount: Prisma.Decimal,
): Prisma.Decimal {
  let discount =
    coupon.type === CouponType.PERCENTAGE
      ? subtotalAmount.mul(coupon.value).div(100)
      : new Prisma.Decimal(coupon.value);

  discount = discount.toDecimalPlaces(2);

  if (discount.gt(subtotalAmount)) {
    discount = subtotalAmount;
  }

  if (discount.lt(0)) {
    return new Prisma.Decimal(0);
  }

  return discount;
}
