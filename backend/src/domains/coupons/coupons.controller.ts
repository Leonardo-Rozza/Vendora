import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  validate(@Body() body: ValidateCouponDto) {
    return this.couponsService.evaluate(
      body.code,
      new Prisma.Decimal(body.subtotalAmount),
    );
  }
}
