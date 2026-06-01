export type CartItemInput = {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CartItem = CartItemInput & {
  id: string;
  cartId: string;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
};

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT';

export type Cart = {
  id: string;
  userId: string;
  status: CartStatus;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  updatedAt: string;
};
