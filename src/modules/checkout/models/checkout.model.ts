export type PaymentMethod = 'cash' | 'card' | 'mobile';

export type CheckoutItemInput = {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutRequest = {
  customer?: {
    name?: string;
    phone?: string;
  };
  discount?: number;
  userId?: number;
  items: CheckoutItemInput[];
  paymentMethod?: PaymentMethod;
  taxRate?: number;
};

export type CheckoutSummaryItem = CheckoutItemInput & {
  lineTotal: number;
};

export type CheckoutResult = {
  checkoutId: string;
  customer?: CheckoutRequest['customer'];
  discount: number;
  items: CheckoutSummaryItem[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
};
