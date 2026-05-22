import { randomUUID } from "crypto";

import {
  CreateProductInput,
  Product,
  ProductQuery,
  UpdateProductInput,
} from "../models/product.model";

export class ProductRepository {
  private readonly products = new Map<string, Product>();

  async create(payload: CreateProductInput): Promise<Product> {
    const timestamp = new Date().toISOString();

    const product: Product = {
      id: randomUUID(),
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      barcode: payload.barcode,
      category: payload.category,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    this.products.set(product.id, product);
    return product;
  }

  async findAll(query: ProductQuery = {}): Promise<Product[]> {
    const { search, category, includeDeleted = false } = query;
    const normalizedSearch = search?.trim().toLowerCase();
    const normalizedCategory = category?.trim().toLowerCase();

    return Array.from(this.products.values()).filter((product) => {
      if (!includeDeleted && product.deletedAt) {
        return false;
      }

      if (
        normalizedCategory &&
        product.category.trim().toLowerCase() !== normalizedCategory
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [product.name, product.barcode, product.category].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const normalizedBarcode = barcode.trim().toLowerCase();

    for (const product of this.products.values()) {
      if (product.barcode.trim().toLowerCase() === normalizedBarcode) {
        return product;
      }
    }

    return null;
  }

  async update(id: string, payload: UpdateProductInput): Promise<Product | null> {
    const existingProduct = this.products.get(id);

    if (!existingProduct) {
      return null;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
}
