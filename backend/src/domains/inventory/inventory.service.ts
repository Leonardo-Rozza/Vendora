import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findByVariantId(variantId: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { variantId },
      include: {
        variant: true,
      },
    });
  }
}
