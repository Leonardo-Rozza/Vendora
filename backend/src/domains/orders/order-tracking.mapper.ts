import {
  FulfillmentStatus,
  OrderMilestoneType,
  OrderStatus,
} from '@prisma/client';
import type {
  AdminOrderTrackingMetadataDto,
  BuyerTrackingStatus,
  OrderTrackingMilestoneResponseDto,
  OrderTrackingResponseDto,
} from './dto/order-tracking-response.dto';

type TrackingOrder = {
  id: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingCode: string | null;
  trackingToken: string | null;
  contactFullName: string;
  totalAmount: { toString(): string };
  currencyCode: string;
  paidAt: Date | null;
  createdAt: Date;
  deliveryReference: string | null;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
  }>;
  milestones: Array<{
    id: string;
    type: OrderMilestoneType;
    title: string;
    description: string | null;
    occurredAt: Date;
    metadata: unknown;
  }>;
};

type TrackingStatusPresentation = {
  status: BuyerTrackingStatus;
  label: string;
  description: string;
};

export function mapOrderToTrackingResponse(
  order: TrackingOrder,
): OrderTrackingResponseDto {
  const status = mapOrderToBuyerTrackingStatus(order);

  return {
    orderId: order.id,
    trackingCode: order.trackingCode,
    trackingToken: order.trackingToken,
    trackingUrlPath: buildTrackingUrlPath(order.trackingToken),
    status: status.status,
    statusLabel: status.label,
    statusDescription: status.description,
    contactName: order.contactFullName,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    totalAmount: order.totalAmount.toString(),
    currencyCode: order.currencyCode,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    deliveryReference: order.deliveryReference,
    timeline: order.milestones.map((milestone) =>
      mapMilestoneToResponse(milestone),
    ),
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
    })),
  };
}

export function mapOrderToAdminTrackingMetadata(
  order: Pick<
    TrackingOrder,
    | 'status'
    | 'fulfillmentStatus'
    | 'trackingCode'
    | 'trackingToken'
    | 'deliveryReference'
  >,
): AdminOrderTrackingMetadataDto {
  const status = mapOrderToBuyerTrackingStatus(order);

  return {
    trackingCode: order.trackingCode,
    trackingToken: order.trackingToken,
    trackingUrlPath: buildTrackingUrlPath(order.trackingToken),
    buyerTrackingStatus: status.status,
    buyerTrackingLabel: status.label,
    buyerTrackingDescription: status.description,
  };
}

export function createMilestoneContent(type: OrderMilestoneType): {
  title: string;
  description: string;
} {
  switch (type) {
    case OrderMilestoneType.ORDER_CREATED:
      return {
        title: 'Pedido recibido',
        description: 'Registramos tu pedido y reservamos tu compra en Vendora.',
      };
    case OrderMilestoneType.PAYMENT_PENDING:
      return {
        title: 'Pago pendiente',
        description: 'Estamos esperando la confirmacion final del pago.',
      };
    case OrderMilestoneType.PAYMENT_CONFIRMED:
      return {
        title: 'Pago confirmado',
        description:
          'Tu pago fue confirmado y comenzamos a preparar el pedido.',
      };
    case OrderMilestoneType.FULFILLMENT_CONFIRMED:
      return {
        title: 'Pedido confirmado para preparacion',
        description:
          'El equipo operativo tomo el pedido y lo ingreso en la cola de preparacion.',
      };
    case OrderMilestoneType.FULFILLMENT_PREPARING:
      return {
        title: 'Preparando pedido',
        description:
          'Estamos armando tu pedido para dejarlo listo para entrega.',
      };
    case OrderMilestoneType.READY_FOR_DELIVERY:
      return {
        title: 'Listo para entrega',
        description: 'Tu pedido ya esta listo y esperando su salida.',
      };
    case OrderMilestoneType.OUT_FOR_DELIVERY:
      return {
        title: 'En camino',
        description:
          'Tu pedido ya salio y va en camino a la direccion informada.',
      };
    case OrderMilestoneType.DELIVERED:
      return {
        title: 'Entregado',
        description: 'La entrega fue marcada como completada.',
      };
    case OrderMilestoneType.ORDER_CANCELLED:
      return {
        title: 'Pedido cancelado',
        description: 'El pedido fue cancelado y ya no seguira avanzando.',
      };
    default:
      return {
        title: 'Actualizacion del pedido',
        description: 'Registramos un nuevo movimiento en el pedido.',
      };
  }
}

export function shouldSendNotificationForMilestone(type: OrderMilestoneType) {
  return (
    type === OrderMilestoneType.PAYMENT_CONFIRMED ||
    type === OrderMilestoneType.OUT_FOR_DELIVERY ||
    type === OrderMilestoneType.DELIVERED
  );
}

export function buildTrackingUrlPath(trackingToken: string | null) {
  return trackingToken ? `/seguimiento/${trackingToken}` : null;
}

function mapMilestoneToResponse(
  milestone: TrackingOrder['milestones'][number],
): OrderTrackingMilestoneResponseDto {
  const fallback = createMilestoneContent(milestone.type);
  const metadata = readMilestoneMetadata(milestone.metadata);

  return {
    id: milestone.id,
    type: milestone.type,
    title: milestone.title,
    description: milestone.description ?? fallback.description,
    occurredAt: milestone.occurredAt.toISOString(),
    deliveryReference: metadata.deliveryReference,
  };
}

function mapOrderToBuyerTrackingStatus(
  order: Pick<
    TrackingOrder,
    'status' | 'fulfillmentStatus' | 'deliveryReference'
  >,
): TrackingStatusPresentation {
  if (order.status === OrderStatus.CANCELLED) {
    return {
      status: 'CANCELADO',
      label: 'Pedido cancelado',
      description:
        'Este pedido fue cancelado y ya no tiene movimientos pendientes.',
    };
  }

  if (order.status !== OrderStatus.PAID) {
    return {
      status: 'PAGO_PENDIENTE',
      label: 'Pago pendiente de validacion',
      description:
        'Tu pedido ya fue registrado. Estamos esperando la confirmacion final del pago para seguir avanzando.',
    };
  }

  switch (order.fulfillmentStatus) {
    case FulfillmentStatus.REQUESTED:
    case FulfillmentStatus.CONFIRMED:
      return {
        status: 'PAGO_CONFIRMADO',
        label: 'Pago confirmado',
        description:
          'El pago ya fue confirmado y el pedido esta entrando en preparacion.',
      };
    case FulfillmentStatus.PREPARING:
      return {
        status: 'PREPARANDO_PEDIDO',
        label: 'Preparando pedido',
        description:
          'Estamos armando tu pedido para dejarlo listo para entrega.',
      };
    case FulfillmentStatus.READY_FOR_DELIVERY:
      return {
        status: 'LISTO_PARA_ENTREGA',
        label: 'Listo para entrega',
        description: order.deliveryReference
          ? `Tu pedido ya esta listo. Referencia operativa: ${order.deliveryReference}.`
          : 'Tu pedido ya esta listo y esperando su salida.',
      };
    case FulfillmentStatus.OUT_FOR_DELIVERY:
      return {
        status: 'EN_CAMINO',
        label: 'En camino',
        description: order.deliveryReference
          ? `Tu pedido esta en camino. Referencia: ${order.deliveryReference}.`
          : 'Tu pedido salio y va en camino a la direccion informada.',
      };
    case FulfillmentStatus.DELIVERED:
      return {
        status: 'ENTREGADO',
        label: 'Entregado',
        description: 'Marcamos la entrega como completada.',
      };
    default:
      return {
        status: 'PAGO_CONFIRMADO',
        label: 'Pago confirmado',
        description: 'El pago ya fue confirmado y el pedido sigue avanzando.',
      };
  }
}

function readMilestoneMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return {
      deliveryReference: null,
    };
  }

  const value = metadata as { deliveryReference?: unknown };

  return {
    deliveryReference:
      typeof value.deliveryReference === 'string'
        ? value.deliveryReference
        : null,
  };
}
