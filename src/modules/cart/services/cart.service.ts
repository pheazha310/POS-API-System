import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { AppError } from '../../../core/errors/app-error';
import type { Cart, CartItemInput } from '../models/cart.model';
import { cartRepository } from '../repositories/cart.repository';

const toMoney = (value: number): number => Number(value.toFixed(2));

const validateCartItem = (payload: Partial<CartItemInput> | undefined): CartItemInput => {
  const item = payload ?? {};
  const name = item.name?.trim();
  const quantity = item.quantity;
  const unitPrice = item.unitPrice;

  if (!name) {
    throw new AppError(
      `${MESSAGES.INVALID_CART_PAYLOAD} Item name is required.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError(
      `${MESSAGES.INVALID_CART_PAYLOAD} Item quantity must be greater than 0.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new AppError(
      `${MESSAGES.INVALID_CART_PAYLOAD} Item unitPrice must be 0 or greater.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return {
    productId: item.productId?.trim() || undefined,
    name,
    quantity,
    unitPrice: toMoney(unitPrice),
  };
};

const normalizeCartItems = (
  payload: Partial<CartItemInput> | Partial<CartItemInput>[] | undefined,
): Partial<CartItemInput>[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return [payload];
  }

  return [];
};

export class CartService {
  public async getCart(userId?: number): Promise<Cart> {
    return cartRepository.findByUserId(userId);
  }

  public async addItem(
    payload: Partial<CartItemInput> | Partial<CartItemInput>[] | undefined,
    userId?: number,
  ): Promise<Cart> {
    const items = normalizeCartItems(payload);

    if (items.length === 0) {
      throw new AppError(
        `${MESSAGES.INVALID_CART_PAYLOAD} At least one item is required.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const normalizedItems = items.map(validateCartItem);

    return cartRepository.addItems(userId, normalizedItems);
  }

  public async removeItem(id: string, userId?: number): Promise<Cart> {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new AppError(MESSAGES.CART_ITEM_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST);
    }

    const itemId = Number(normalizedId);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      throw new AppError(MESSAGES.CART_ITEM_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST);
    }

    const removedItem = await cartRepository.removeItem(userId, itemId);

    if (!removedItem) {
      throw new AppError(MESSAGES.CART_ITEM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return removedItem;
  }

  public async clearCart(userId?: number): Promise<Cart> {
    return cartRepository.clear(userId);
  }
}

export const cartService = new CartService();
