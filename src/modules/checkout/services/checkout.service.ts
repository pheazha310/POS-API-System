import { randomUUID } from 'node:crypto';

import { getConnection } from '../../../config/database';
import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { AppError } from '../../../core/errors/app-error';
import { saleRepository } from '../../sales/repositories/sale.repository';
import type {
  CheckoutItemInput,
  CheckoutRequest,
  CheckoutResult,
  PaymentMethod,
} from '../models/checkout.model';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

type MySqlIdRow = RowDataPacket & {
  id: number;
};

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

const toMoney = (value: number): number => Number(value.toFixed(2));

export class CheckoutService {
  public async createCheckout(payload: Partial<CheckoutRequest> | undefined): Promise<CheckoutResult> {
    const checkoutPayload = payload ?? {};
    const checkoutItems = Array.isArray(checkoutPayload.items) ? checkoutPayload.items : [];

    if (checkoutItems.length === 0) {
      throw new AppError(
        `${MESSAGES.INVALID_CHECKOUT_PAYLOAD} At least one item is required.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const discount = checkoutPayload.discount ?? 0;
    const taxRate = checkoutPayload.taxRate ?? 0;
    const paymentMethod = checkoutPayload.paymentMethod ?? 'cash';

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

    checkoutItems.forEach(validateItem);

    const items = checkoutItems.map((item) => ({
      ...item,
      name: item.name.trim(),
      lineTotal: toMoney(item.quantity * item.unitPrice),
    }));

    const subtotal = toMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxAmount = toMoney((discountedSubtotal * taxRate) / 100);
    const total = toMoney(discountedSubtotal + taxAmount);

    try {
      const result = await this.createDatabaseCheckout(checkoutPayload, items, discount, taxRate, subtotal, taxAmount, total, paymentMethod);
      return result;
    } catch (_error) {
      return this.createFallbackCheckout(checkoutPayload, items, discount, taxRate, subtotal, taxAmount, total, paymentMethod);
    }
  }

  private async createDatabaseCheckout(
    checkoutPayload: Partial<CheckoutRequest>,
    items: Array<CheckoutItemInput & { lineTotal: number; name: string }>,
    discount: number,
    taxRate: number,
    subtotal: number,
    taxAmount: number,
    total: number,
    paymentMethod: PaymentMethod,
  ): Promise<CheckoutResult> {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const userId = await this.resolveSaleUserId(connection, checkoutPayload.userId);
      const normalizedPaymentMethod = paymentMethod.toUpperCase();
      const [saleResult] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO sales (
            user_id,
            total_amount,
            paid_amount,
            change_amount,
            payment_method,
            status
          ) VALUES (?, ?, ?, ?, ?, 'COMPLETED')
        `,
        [userId, total, total, 0, normalizedPaymentMethod],
      );

      const saleId = saleResult.insertId;

      for (const item of items) {
        const productId = await this.resolveProductId(connection, item);

        await connection.query(
          `
            INSERT INTO sale_items (
              sale_id,
              product_id,
              quantity,
              unit_price,
              discount,
              total_price
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [saleId, productId, item.quantity, item.unitPrice, 0, item.lineTotal],
        );
      }

      await connection.commit();

      return {
        checkoutId: `chk_${saleId}`,
        customer: checkoutPayload.customer,
        discount: toMoney(discount),
        items,
        paymentMethod,
        subtotal,
        taxAmount,
        taxRate: toMoney(taxRate),
        total,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async createFallbackCheckout(
    checkoutPayload: Partial<CheckoutRequest>,
    items: Array<CheckoutItemInput & { lineTotal: number; name: string }>,
    discount: number,
    taxRate: number,
    subtotal: number,
    taxAmount: number,
    total: number,
    paymentMethod: PaymentMethod,
  ): Promise<CheckoutResult> {
    const checkoutId = `chk_${randomUUID()}`;

    saleRepository.create({
      id: `sale_${randomUUID()}`,
      customer: checkoutPayload.customer?.name?.trim()
        ? {
            name: checkoutPayload.customer.name.trim(),
            phone: checkoutPayload.customer.phone?.trim() || undefined,
          }
        : undefined,
      discount: toMoney(discount),
      items: items.map((item, index) => ({
        productId: item.productId ?? `item_${index + 1}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      paymentMethod,
      soldAt: new Date().toISOString(),
      subtotal,
      taxAmount,
      taxRate: toMoney(taxRate),
      total,
    });

    return {
      checkoutId,
      customer: checkoutPayload.customer,
      discount: toMoney(discount),
      items,
      paymentMethod,
      subtotal,
      taxAmount,
      taxRate: toMoney(taxRate),
      total,
    };
  }

  private async resolveSaleUserId(
    connection: Awaited<ReturnType<typeof getConnection>>,
    userId?: number,
  ): Promise<number> {
    if (Number.isInteger(userId) && (userId ?? 0) > 0) {
      const [rows] = await connection.query<MySqlIdRow[]>(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [userId],
      );

      if (rows[0]) {
        return rows[0].id;
      }
    }

    const [existingUsers] = await connection.query<MySqlIdRow[]>(
      'SELECT id FROM users ORDER BY id ASC LIMIT 1',
    );

    if (existingUsers[0]) {
      return existingUsers[0].id;
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO users (name, email, password, role, is_active)
        VALUES (?, ?, ?, 'ADMIN', 1)
      `,
      ['System User', 'system@pos.local', 'system'],
    );

    return insertResult.insertId;
  }

  private async resolveProductId(
    connection: Awaited<ReturnType<typeof getConnection>>,
    item: CheckoutItemInput & { lineTotal: number; name: string },
  ): Promise<number> {
    const resolvedProductId = this.extractNumericId(item.productId);

    if (resolvedProductId !== undefined) {
      const [existingProducts] = await connection.query<MySqlIdRow[]>(
        'SELECT id FROM products WHERE id = ? LIMIT 1',
        [resolvedProductId],
      );

      if (existingProducts[0]) {
        return existingProducts[0].id;
      }
    }

    const [existingByName] = await connection.query<MySqlIdRow[]>(
      'SELECT id FROM products WHERE name = ? LIMIT 1',
      [item.name],
    );

    if (existingByName[0]) {
      return existingByName[0].id;
    }

    const [categoryRows] = await connection.query<MySqlIdRow[]>(
      'SELECT id FROM categories WHERE name = ? LIMIT 1',
      ['General'],
    );

    let categoryId = categoryRows[0]?.id;

    if (!categoryId) {
      const [categoryResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO categories (name, description, is_active) VALUES (?, ?, 1)',
        ['General', 'Auto-created checkout category'],
      );

      categoryId = categoryResult.insertId;
    }

    if (resolvedProductId !== undefined) {
      await connection.query(
        `
          INSERT INTO products (
            id,
            category_id,
            name,
            barcode,
            price,
            stock,
            unit,
            is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          resolvedProductId,
          categoryId,
          item.name,
          item.productId ?? `prod_${resolvedProductId}`,
          item.unitPrice,
          0,
          'pcs',
        ],
      );

      return resolvedProductId;
    }

    const [productResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO products (
          category_id,
          name,
          barcode,
          price,
          stock,
          unit,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        categoryId,
        item.name,
        item.productId ?? `prod_${randomUUID()}`,
        item.unitPrice,
        0,
        'pcs',
      ],
    );

    return productResult.insertId;
  }

  private extractNumericId(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const digits = value.match(/\d+/)?.[0];

    if (!digits) {
      return undefined;
    }

    const parsed = Number(digits);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
}

export const checkoutService = new CheckoutService();
