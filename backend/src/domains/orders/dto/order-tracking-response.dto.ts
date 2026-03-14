export type BuyerTrackingStatus =
  | 'PAGO_PENDIENTE'
  | 'PAGO_CONFIRMADO'
  | 'PREPARANDO_PEDIDO'
  | 'LISTO_PARA_ENTREGA'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type OrderTrackingMilestoneResponseDto = {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  deliveryReference: string | null;
};

export type OrderTrackingResponseDto = {
  orderId: string;
  trackingCode: string | null;
  trackingToken: string | null;
  trackingUrlPath: string | null;
  status: BuyerTrackingStatus;
  statusLabel: string;
  statusDescription: string;
  contactName: string;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  paidAt: string | null;
  createdAt: string;
  deliveryReference: string | null;
  timeline: OrderTrackingMilestoneResponseDto[];
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
  }>;
};

export type AdminOrderTrackingMetadataDto = {
  trackingCode: string | null;
  trackingToken: string | null;
  trackingUrlPath: string | null;
  buyerTrackingStatus: BuyerTrackingStatus;
  buyerTrackingLabel: string;
  buyerTrackingDescription: string;
};
