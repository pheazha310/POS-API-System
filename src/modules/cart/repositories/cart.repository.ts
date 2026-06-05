import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getConnection, query } from '../../../config/database';
import type { Cart, CartItem, CartItemInput, CartStatus } from '../models/cart.model';

type CartRow = RowDataPacket & {
  id: number;
  user_id: number;
  status: CartStatus;
  updated_at: Date | string;
};

type CartItemRow = RowDataPacket & {
  id: number;
  cart_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string | number;
  created_at: Date | string;
  updated_at: Date | string;
};

type IdRow = RowDataPacket & {
  id: number;
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

const toTimestamp = (value: Date | string): string => new Date(value).toISOString();

const toCartStatus = (value: string): CartStatus => {
  return value === 'CHECKED_OUT' ? 'CHECKED_OUT' : 'ACTIVE';
};

export class CartRepository {
  private readonly memoryCarts = new Map<number, Cart>();
  private memoryItemSeq = 1;

  public async findByUserId(userId?: number): Promise<Cart> {
    try {
      const cartRow = await this.findOrCreateCart(userId);

      return this.loadCart(cartRow.id, cartRow.user_id, cartRow.status, cartRow.updated_at);
    } catch (_error) {
      return this.getMemoryCart(userId);
    }
  }

  public async addItem(userId: number | undefined, input: CartItemInput): Promise<Cart> {
    return this.addItems(userId, [input]);
  }

  public async addItems(userId: number | undefined, inputs: CartItemInput[]): Promise<Cart> {
    try {
      const connection = await getConnection();

      await connection.beginTransaction();

      const resolvedUserId = await this.resolveUserId(connection, userId);
      const cartRow = await this.findOrCreateCart(resolvedUserId, connection);

      for (const input of inputs) {
        const productId = await this.resolveProductId(connection, input);
        const normalizedQuantity = input.quantity;
        const normalizedUnitPrice = roundMoney(input.unitPrice);

        await connection.query(
          `
            INSERT INTO cart_items (
              cart_id,
              product_id,
              quantity,
              unit_price
            ) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity = quantity + VALUES(quantity),
              unit_price = VALUES(unit_price),
              updated_at = CURRENT_TIMESTAMP,
              deleted_at = NULL
          `,
          [cartRow.id, productId, normalizedQuantity, normalizedUnitPrice],
        );
      }

      await connection.query(
        'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [cartRow.id],
      );

      await connection.commit();
      return this.loadCart(cartRow.id, resolvedUserId, cartRow.status, new Date());
    } catch (error) {
      return this.addItemsInMemory(userId, inputs);
    } finally {
      // connection is only available if the DB path succeeded up to getConnection().
    }
  }

  public async removeItem(userId: number | undefined, itemId: number): Promise<Cart | undefined> {
    try {
      const connection = await getConnection();

      await connection.beginTransaction();

      const resolvedUserId = await this.resolveUserId(connection, userId);
      const cartRow = await this.findOrCreateCart(resolvedUserId, connection);
      let [deleteResult] = await connection.query<ResultSetHeader>(
        `
          UPDATE cart_items
          SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND cart_id = ? AND deleted_at IS NULL
        `,
        [itemId, cartRow.id],
      );

      if (deleteResult.affectedRows === 0) {
        [deleteResult] = await connection.query<ResultSetHeader>(
          `
            UPDATE cart_items
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ? AND cart_id = ? AND deleted_at IS NULL
          `,
          [itemId, cartRow.id],
        );
      }

      if (deleteResult.affectedRows === 0) {
        await connection.rollback();
        return undefined;
      }

      await connection.query(
        'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [cartRow.id],
      );

      await connection.commit();
      return this.loadCart(cartRow.id, resolvedUserId, cartRow.status, new Date());
    } catch (error) {
      return this.removeItemInMemory(userId, itemId);
    } finally {
      // connection is only available if the DB path succeeded up to getConnection().
    }
  }

  public async clear(userId: number | undefined): Promise<Cart> {
    try {
      const connection = await getConnection();

      await connection.beginTransaction();

      const resolvedUserId = await this.resolveUserId(connection, userId);
      const cartRow = await this.findOrCreateCart(resolvedUserId, connection);

      await connection.query(
        `
          UPDATE cart_items
          SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE cart_id = ? AND deleted_at IS NULL
        `,
        [cartRow.id],
      );

      await connection.query(
        'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [cartRow.id],
      );

      await connection.commit();
      return this.loadCart(cartRow.id, resolvedUserId, cartRow.status, new Date());
    } catch (error) {
      return this.clearInMemory(userId);
    } finally {
      // connection is only available if the DB path succeeded up to getConnection().
    }
  }

  private async findOrCreateCart(
    userId: number | undefined,
    connection: Awaited<ReturnType<typeof getConnection>> | null = null,
  ): Promise<CartRow> {
    const database = connection ?? (await getConnection());

    try {
      const resolvedUserId = await this.resolveUserId(database, userId);

      const [insertResult] = await database.query<ResultSetHeader>(
        `
          INSERT INTO carts (user_id, status)
          VALUES (?, 'ACTIVE')
          ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            updated_at = CURRENT_TIMESTAMP
        `,
        [resolvedUserId],
      );

      const [rows] = await database.query<CartRow[]>(
        `
          SELECT id, user_id, status, updated_at
          FROM carts
          WHERE id = ?
          LIMIT 1
        `,
        [insertResult.insertId],
      );

      if (!rows[0]) {
        throw new Error('Unable to load cart after create or reuse.');
      }

      return rows[0];
    } finally {
      if (!connection) {
        database.release();
      }
    }
  }

  private async resolveUserId(
    connection: Awaited<ReturnType<typeof getConnection>>,
    userId?: number,
  ): Promise<number> {
    if (Number.isInteger(userId) && (userId ?? 0) > 0) {
      const [rows] = await connection.query<IdRow[]>(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [userId],
      );

      if (rows[0]) {
        return rows[0].id;
      }
    }

    const [existingUsers] = await connection.query<IdRow[]>(
      'SELECT id FROM users ORDER BY id ASC LIMIT 1',
    );

    if (existingUsers[0]) {
      return existingUsers[0].id;
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO users (name, email, password, role, is_active)
        VALUES (?, ?, ?, 'ADMIN', 1)
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          updated_at = CURRENT_TIMESTAMP
      `,
      ['System User', 'system@pos.local', 'system'],
    );

    return insertResult.insertId;
  }

  private async loadCart(
    cartId: number,
    userId: number,
    status: CartStatus,
    updatedAt: Date | string,
  ): Promise<Cart> {
    try {
      const [itemRows] = await query<CartItemRow[]>(
        `
          SELECT
            ci.id,
            ci.cart_id,
            ci.product_id,
            p.name AS product_name,
            ci.quantity,
            ci.unit_price,
            ci.created_at,
            ci.updated_at
          FROM cart_items ci
          LEFT JOIN products p ON p.id = ci.product_id
          WHERE ci.cart_id = ? AND ci.deleted_at IS NULL
          ORDER BY ci.id ASC
        `,
        [cartId],
      );

      const items = itemRows.map<CartItem>((row) => ({
        id: String(row.id),
        cartId: String(row.cart_id),
        productId: String(row.product_id),
        name: row.product_name ?? `Product #${row.product_id}`,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price),
        lineTotal: roundMoney(Number(row.quantity) * Number(row.unit_price)),
        createdAt: toTimestamp(row.created_at),
        updatedAt: toTimestamp(row.updated_at),
      }));

      const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));

      return {
        id: String(cartId),
        userId: String(userId),
        status,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        updatedAt: toTimestamp(updatedAt),
      };
    } catch (_error) {
      return this.getMemoryCart(userId);
    }
  }

  private async resolveProductId(
    connection: Awaited<ReturnType<typeof getConnection>>,
    item: CartItemInput,
  ): Promise<number> {
    const normalizedProductId = this.extractNumericId(item.productId);

    if (normalizedProductId !== undefined) {
      const [existingRows] = await connection.query<IdRow[]>(
        'SELECT id FROM products WHERE id = ? LIMIT 1',
        [normalizedProductId],
      );

      if (existingRows[0]) {
        return existingRows[0].id;
      }
    }

    const [existingByName] = await connection.query<IdRow[]>(
      'SELECT id FROM products WHERE name = ? LIMIT 1',
      [item.name.trim()],
    );

    if (existingByName[0]) {
      return existingByName[0].id;
    }

    const [categoryRows] = await connection.query<IdRow[]>(
      'SELECT id FROM categories WHERE name = ? LIMIT 1',
      ['General'],
    );

    let categoryId = categoryRows[0]?.id;

    if (!categoryId) {
      const [categoryResult] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO categories (name, description, is_active)
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            description = VALUES(description),
            is_active = VALUES(is_active),
            updated_at = CURRENT_TIMESTAMP
        `,
        ['General', 'Auto-created cart category'],
      );

      categoryId = categoryResult.insertId;
    }

    if (normalizedProductId !== undefined) {
      const [productResult] = await connection.query<ResultSetHeader>(
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
          ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            category_id = VALUES(category_id),
            name = VALUES(name),
            barcode = VALUES(barcode),
            price = VALUES(price),
            stock = VALUES(stock),
            unit = VALUES(unit),
            is_active = VALUES(is_active),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          normalizedProductId,
          categoryId,
          item.name.trim(),
          item.productId ?? `prod_${normalizedProductId}`,
          roundMoney(item.unitPrice),
          0,
          'pcs',
        ],
      );

      return productResult.insertId;
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
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          category_id = VALUES(category_id),
          name = VALUES(name),
          barcode = VALUES(barcode),
          price = VALUES(price),
          stock = VALUES(stock),
          unit = VALUES(unit),
          is_active = VALUES(is_active),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        categoryId,
        item.name.trim(),
        item.productId ?? `prod_${Date.now()}`,
        roundMoney(item.unitPrice),
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

  private getMemoryCart(userId?: number): Cart {
    const resolvedUserId = Number.isInteger(userId) && (userId ?? 0) > 0 ? userId! : 1;
    const existingCart = this.memoryCarts.get(resolvedUserId);

    if (existingCart) {
      return existingCart;
    }

    const cart: Cart = {
      id: `mem_${resolvedUserId}`,
      userId: String(resolvedUserId),
      status: 'ACTIVE',
      items: [],
      itemCount: 0,
      subtotal: 0,
      updatedAt: new Date().toISOString(),
    };

    this.memoryCarts.set(resolvedUserId, cart);
    return cart;
  }

  private addItemsInMemory(userId: number | undefined, inputs: CartItemInput[]): Cart {
    const cart = this.getMemoryCart(userId);
    const itemMap = new Map(cart.items.map((item) => [item.productId || item.name, item]));

    for (const input of inputs) {
      const key = input.productId?.trim() || input.name.trim();
      const existingItem = itemMap.get(key);

      if (existingItem) {
        existingItem.quantity += input.quantity;
        existingItem.unitPrice = roundMoney(input.unitPrice);
        existingItem.lineTotal = roundMoney(existingItem.quantity * existingItem.unitPrice);
        existingItem.updatedAt = new Date().toISOString();
        continue;
      }

      const item: CartItem = {
        id: String(this.memoryItemSeq++),
        cartId: cart.id,
        productId: input.productId?.trim() || String(this.memoryItemSeq),
        name: input.name.trim(),
        quantity: input.quantity,
        unitPrice: roundMoney(input.unitPrice),
        lineTotal: roundMoney(input.quantity * input.unitPrice),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cart.items.push(item);
      itemMap.set(key, item);
    }

    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = roundMoney(cart.items.reduce((sum, item) => sum + item.lineTotal, 0));
    cart.updatedAt = new Date().toISOString();

    this.memoryCarts.set(Number(cart.userId), cart);
    return cart;
  }

  private removeItemInMemory(userId: number | undefined, itemId: number): Cart | undefined {
    const cart = this.getMemoryCart(userId);
    const nextItems = cart.items.filter((item) => Number(item.id) !== itemId);

    if (nextItems.length === cart.items.length) {
      return undefined;
    }

    cart.items = nextItems;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = roundMoney(cart.items.reduce((sum, item) => sum + item.lineTotal, 0));
    cart.updatedAt = new Date().toISOString();

    this.memoryCarts.set(Number(cart.userId), cart);
    return cart;
  }

  private clearInMemory(userId: number | undefined): Cart {
    const cart = this.getMemoryCart(userId);
    cart.items = [];
    cart.itemCount = 0;
    cart.subtotal = 0;
    cart.updatedAt = new Date().toISOString();

    this.memoryCarts.set(Number(cart.userId), cart);
    return cart;
  }
}

export const cartRepository = new CartRepository();
