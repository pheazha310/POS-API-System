import type { PaymentMethod } from '../../checkout/models/checkout.model';

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleCustomer = {
  name: string;
  phone?: string;
};

export type Sale = {
  id: string;
  customer?: SaleCustomer;
  discount: number;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  soldAt: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
};
