import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { AppError } from '../../../core/errors/app-error';
import type {
  CheckoutItemInput,
  CheckoutRequest,
  CheckoutResult,
  PaymentMethod,
} from '../models/checkout.model';

const isValidPaymentMethod = (value: unknown): value is PaymentMethod => {
  return value === 'cash' || value === 'card' || value === 'mobile';
};

const validateItem = (item: CheckoutItemInput, index: number): void => {
  if (!item.name?.trim()) {
    throw new AppError(`${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Item ${index + 1} name is required.`, HTTP_STATUS.BAD_REQUEST);
  }

  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    throw new AppError(`${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Item ${index + 1} quantity must be greater than 0.`, HTTP_STATUS.BAD_REQUEST);
  }

  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
    throw new AppError(`${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Item ${index + 1} unitPrice must be 0 or greater.`, HTTP_STATUS.BAD_REQUEST);
  }
};

export class CheckoutService {
  public createCheckout(payload: CheckoutRequest): CheckoutResult {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new AppError(
        `${MESSAGES.INVALID_CHECKOUT_PAYLOAD} At least one item is required.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const discount = payload.discount ?? 0;
    const taxRate = payload.taxRate ?? 0;
    const paymentMethod = payload.paymentMethod ?? 'cash';

    if (!Number.isFinite(discount) || discount < 0) {
      throw new AppError(
        `${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Discount must be 0 or greater.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!Number.isFinite(taxRate) || taxRate < 0) {
      throw new AppError(
        `${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Tax rate must be 0 or greater.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!isValidPaymentMethod(paymentMethod)) {
      throw new AppError(
        `${MESSAGES.INVALID_CHECKOUT_PAYLOAD} Payment method must be cash, card, or mobile.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    payload.items.forEach(validateItem);

    const items = payload.items.map((item) => ({
      ...item,
      name: item.name.trim(),
      lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));

    const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxAmount = Number(((discountedSubtotal * taxRate) / 100).toFixed(2));
    const total = Number((discountedSubtotal + taxAmount).toFixed(2));

    return {
      checkoutId: `chk_${Date.now()}`,
      customer: payload.customer,
      discount: Number(discount.toFixed(2)),
      items,
      paymentMethod,
      subtotal,
      taxAmount,
      taxRate: Number(taxRate.toFixed(2)),
      total,
    };
  }
}

export const checkoutService = new CheckoutService();
