import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { getConnection } from '../../../config/database';
import type {
  CreateProductInput,
  Product,
  ProductQuery,
  UpdateProductInput,
} from '../models/product.model';

type ProductRow = RowDataPacket & {
  id: number;
  category_id: number;
  category_name: string | null;
  name: string;
  barcode: string;
  price: number | string;
  stock: number;
  unit: string | null;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
};

type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
};

const toTimestamp = (value: Date | string): string => new Date(value).toISOString();

const toNullableTimestamp = (value: Date | string | null): string | null => {
  return value ? new Date(value).toISOString() : null;
};

const toMoney = (value: number): number => Number(value.toFixed(2));

export class ProductRepository {
  async create(payload: CreateProductInput): Promise<Product> {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const categoryId = await this.resolveCategoryId(connection, payload.category);
      const [insertResult] = await connection.query<ResultSetHeader>(
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
          payload.name.trim(),
          payload.barcode.trim(),
          toMoney(payload.price),
          payload.stock,
          'pcs',
        ],
      );

      const product = await this.findByIdInternal(connection, insertResult.insertId);

      if (!product) {
        throw new Error('Unable to load product after insert.');
      }

      await connection.commit();
      return product;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    const connection = await getConnection();

    try {
      const clauses: string[] = [];
      const params: unknown[] = [];
      const normalizedSearch = query.search?.trim().toLowerCase();
      const normalizedCategory = query.category?.trim().toLowerCase();

      if (!query.includeDeleted) {
        clauses.push('p.deleted_at IS NULL');
      }

      if (normalizedCategory) {
        clauses.push(
          '(LOWER(c.name) = ? OR CAST(p.category_id AS CHAR) = ?)',
        );
        params.push(normalizedCategory, normalizedCategory);
      }

      if (normalizedSearch) {
        const like = `%${normalizedSearch}%`;
        clauses.push(
          `(LOWER(p.name) LIKE ? OR LOWER(p.barcode) LIKE ? OR LOWER(c.name) LIKE ?)`,
        );
        params.push(like, like, like);
      }

      const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

      const [rows] = await connection.query<ProductRow[]>(
        `
          SELECT
            p.id,
            p.category_id,
            c.name AS category_name,
            p.name,
            p.barcode,
            p.price,
            p.stock,
            p.unit,
            p.is_active,
            p.created_at,
            p.updated_at,
            p.deleted_at
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          ${whereClause}
          ORDER BY p.id ASC
        `,
        params,
      );

      return rows.map((row) => this.mapRow(row));
    } catch (_error) {
      return [];
    } finally {
      connection.release();
    }
  }

  async findById(id: string): Promise<Product | null> {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return null;
    }

    const connection = await getConnection();

    try {
      return this.findByIdInternal(connection, parsedId);
    } catch (_error) {
      return null;
    } finally {
      connection.release();
    }
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const connection = await getConnection();

    try {
      const [rows] = await connection.query<ProductRow[]>(
        `
          SELECT
            p.id,
            p.category_id,
            c.name AS category_name,
            p.name,
            p.barcode,
            p.price,
            p.stock,
            p.unit,
            p.is_active,
            p.created_at,
            p.updated_at,
            p.deleted_at
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.barcode = ?
          LIMIT 1
        `,
        [barcode.trim()],
      );

      return rows[0] ? this.mapRow(rows[0]) : null;
    } catch (_error) {
      return null;
    } finally {
      connection.release();
    }
  }

  async update(id: string, payload: UpdateProductInput): Promise<Product | null> {
    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return null;
    }

    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const existingProduct = await this.findByIdInternal(connection, parsedId);

      if (!existingProduct) {
        await connection.rollback();
        return null;
      }

      const assignments: string[] = [];
      const params: unknown[] = [];

      if (payload.name !== undefined) {
        assignments.push('name = ?');
        params.push(payload.name.trim());
      }

      if (payload.price !== undefined) {
        assignments.push('price = ?');
        params.push(toMoney(payload.price));
      }

      if (payload.stock !== undefined) {
        assignments.push('stock = ?');
        params.push(payload.stock);
      }

      if (payload.barcode !== undefined) {
        assignments.push('barcode = ?');
        params.push(payload.barcode.trim());
      }

      if (payload.category !== undefined) {
        const categoryId = await this.resolveCategoryId(connection, payload.category);
        assignments.push('category_id = ?');
        params.push(categoryId);
      }

      if (payload.deletedAt !== undefined) {
        assignments.push('deleted_at = ?');
        params.push(payload.deletedAt ? new Date(payload.deletedAt) : null);
      }

      assignments.push('updated_at = CURRENT_TIMESTAMP');

      await connection.query<ResultSetHeader>(
        `
          UPDATE products
          SET ${assignments.join(', ')}
          WHERE id = ?
        `,
        [...params, parsedId],
      );

      const updatedProduct = await this.findByIdInternal(connection, parsedId);

      await connection.commit();
      return updatedProduct;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async findByIdInternal(
    connection: Awaited<ReturnType<typeof getConnection>>,
    id: number,
  ): Promise<Product | null> {
    const [rows] = await connection.query<ProductRow[]>(
      `
        SELECT
          p.id,
          p.category_id,
          c.name AS category_name,
          p.name,
          p.barcode,
          p.price,
          p.stock,
          p.unit,
          p.is_active,
          p.created_at,
          p.updated_at,
          p.deleted_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  private async resolveCategoryId(
    connection: Awaited<ReturnType<typeof getConnection>>,
    category: string,
  ): Promise<number> {
    const normalizedCategory = category.trim();

    const [rows] = await connection.query<CategoryRow[]>(
      `
        SELECT id, name
        FROM categories
        WHERE LOWER(name) = LOWER(?)
        LIMIT 1
      `,
      [normalizedCategory],
    );

    if (rows[0]) {
      return rows[0].id;
    }

    const [insertResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO categories (name, description, is_active)
        VALUES (?, ?, 1)
      `,
      [normalizedCategory, 'Auto-created product category'],
    );

    return insertResult.insertId;
  }

  private mapRow(row: ProductRow): Product {
    return {
      id: String(row.id),
      name: row.name,
      price: Number(row.price),
      stock: Number(row.stock),
      barcode: String(row.barcode),
      category: row.category_name?.trim() || `Category #${row.category_id}`,
      createdAt: toTimestamp(row.created_at),
      updatedAt: toTimestamp(row.updated_at),
      deletedAt: toNullableTimestamp(row.deleted_at),
    };
  }
}
