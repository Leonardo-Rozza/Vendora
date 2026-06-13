import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  validate(@Body() body: ValidateCouponDto) {
    return this.couponsService.evaluate(
      body.code,
      new Prisma.Decimal(body.subtotalAmount),
    );
  }
}
