import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrderParamsDto } from './dto/order-params.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  createOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body);
  }

  @Get('admin/orders')
  listOrders(@Query() query: ListOrdersDto) {
    return this.ordersService.listOrders(query.status);
  }

  @Get('admin/orders/:orderId')
  async getOrder(@Param() params: OrderParamsDto) {
    const order = await this.ordersService.findOrderById(params.orderId);

    if (!order) {
      throw new NotFoundException(`Order ${params.orderId} was not found`);
    }

    return order;
  }

  @Post('admin/orders/:orderId/cancel')
  cancelOrder(@Param() params: OrderParamsDto) {
    return this.ordersService.cancelOrder(params.orderId);
  }
}
