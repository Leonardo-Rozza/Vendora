import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrderParamsDto } from './dto/order-params.dto';
import { UpdateOrderFulfillmentDto } from './dto/update-order-fulfillment.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  createOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @Get('admin/orders')
  @UseGuards(AdminSessionGuard)
  listOrders(@Query() query: ListOrdersDto) {
    return this.ordersService.listOrders(query.status, query.fulfillmentStatus);
  }

  @Get('admin/orders/:orderId')
  @UseGuards(AdminSessionGuard)
  async getOrder(@Param() params: OrderParamsDto) {
    const order = await this.ordersService.findOrderById(params.orderId);

    if (!order) {
      throw new NotFoundException(`Order ${params.orderId} was not found`);
    }

    return order;
  }

  @Post('admin/orders/:orderId/cancel')
  @UseGuards(AdminSessionGuard)
  cancelOrder(@Param() params: OrderParamsDto) {
    return this.ordersService.cancelOrder(params.orderId);
  }

  @Patch('admin/orders/:orderId/fulfillment')
  @UseGuards(AdminSessionGuard)
  updateOrderFulfillment(
    @Param() params: OrderParamsDto,
    @Body() body: UpdateOrderFulfillmentDto,
  ) {
    return this.ordersService.updateOrderFulfillment(params.orderId, body);
  }
}
