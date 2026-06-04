import pool from "../../../config/database";

import {
  CreateProductInput,
  Product,
  ProductQuery,
  UpdateProductInput,
} from "../models/product.model";

export class ProductRepository {
  async create(payload: CreateProductInput, categoryId: number): Promise<Product> {
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO products
        (category_id, name, barcode, price, stock, unit, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      categoryId,
      payload.name,
      payload.barcode,
      payload.price,
      payload.stock,
      payload.unit,
      1,
      timestamp,
      timestamp,
    ]);

    const insertId = (result as any).insertId;

    return {
      id: insertId.toString(),
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      barcode: payload.barcode,
      category: payload.category,
      unit: payload.unit,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
  }

  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    const { search, category, includeDeleted = false } = query;

    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!includeDeleted) {
      sql += " AND p.deleted_at IS NULL";
    }

    if (category) {
      sql += " AND LOWER(c.name) = LOWER(?)";
      params.push(category);
    }

    if (search) {
      sql +=
        " AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.barcode) LIKE LOWER(?) OR LOWER(c.name) LIKE LOWER(?))";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += " ORDER BY p.barcode ASC";

    const [rows] = await pool.query(sql, params);
    return (rows as any[]).map((row) => this.mapRowToProduct(row));
  }

  async findById(id: string): Promise<Product | null> {
    const [rows] = await pool.query(
      `
        SELECT p.*, c.name AS category_name
        FROM products p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
      [id],
    );

    const product = (rows as any[])[0];
    return product ? this.mapRowToProduct(product) : null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const [rows] = await pool.query(
      `
        SELECT p.*, c.name AS category_name
        FROM products p
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.barcode = ?
      `,
      [barcode],
    );

    const product = (rows as any[])[0];
    return product ? this.mapRowToProduct(product) : null;
  }

  async findOrCreateCategoryId(name: string): Promise<number> {
    const normalized = name.trim();

    const [rows] = await pool.query(
      "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [normalized],
    );

    const category = (rows as any[])[0];
    if (category) {
      return Number(category.id);
    }

    const timestamp = new Date().toISOString();
    const [result] = await pool.query(
      `INSERT INTO categories (name, description, is_active, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?)`,
      [normalized, normalized, timestamp, timestamp],
    );

    return Number((result as any).insertId);
  }

  async update(id: string, payload: UpdateProductInput, categoryId?: number): Promise<Product | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (payload.name !== undefined) {
      fields.push("name = ?");
      values.push(payload.name);
    }
    if (payload.price !== undefined) {
      fields.push("price = ?");
      values.push(payload.price);
    }
    if (payload.stock !== undefined) {
      fields.push("stock = ?");
      values.push(payload.stock);
    }
    if (payload.unit !== undefined) {
      fields.push("unit = ?");
      values.push(payload.unit);
    }
    if (payload.barcode !== undefined) {
      fields.push("barcode = ?");
      values.push(payload.barcode);
    }
    if (categoryId !== undefined) {
      fields.push("category_id = ?");
      values.push(categoryId);
    }
    if (payload.deletedAt !== undefined) {
      fields.push("deleted_at = ?");
      values.push(payload.deletedAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(query, values);

    return this.findById(id);
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id?.toString() ?? "",
      name: row.name,
      price: Number(row.price),
      stock: Number(row.stock),
      unit: row.unit,
      barcode: row.barcode,
      category: row.category_name || "",
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
      deletedAt: row.deleted_at?.toISOString?.() || row.deleted_at || null,
    };
  }
}
