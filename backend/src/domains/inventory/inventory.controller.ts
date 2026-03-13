import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { InventoryService } from './inventory.service';
import { InventoryVariantParamsDto } from './dto/inventory-variant-params.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('admin/inventory')
@UseGuards(AdminSessionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('variants/:variantId')
  async getInventory(@Param() params: InventoryVariantParamsDto) {
    const inventory = await this.inventoryService.findByVariantId(
      params.variantId,
    );

    if (!inventory) {
      throw new NotFoundException(
        `Inventory for variant ${params.variantId} was not found`,
      );
    }

    return inventory;
  }

  @Patch('variants/:variantId')
  updateInventory(
    @Param() params: InventoryVariantParamsDto,
    @Body() body: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateAvailableQuantity(
      params.variantId,
      body.availableQuantity,
    );
  }
}
