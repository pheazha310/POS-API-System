import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../core/errors/app-error";
import {
  CreateProductInput,
  Product,
  ProductQuery,
  UpdateProductInput,
} from "../models/product.model";
import { ProductRepository } from "../repositories/product.repository";

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(payload: CreateProductInput): Promise<Product> {
    this.validateCreatePayload(payload);
    await this.ensureBarcodeIsUnique(payload.barcode);

    const categoryId = await this.resolveCategoryId(payload.category);

    return this.productRepository.create(
      this.sanitizeCreatePayload(payload),
      categoryId,
    );
  }

  async getProducts(query: ProductQuery): Promise<Product[]> {
    const products = await this.productRepository.findAll(query);
    return products.sort((a, b) => a.barcode.localeCompare(b.barcode));
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findByBarcode(barcode);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return product;
  }

  async getProductCategories(): Promise<
    Array<{ category: string; count: number }>
  > {
    const products = await this.productRepository.findAll({
      includeDeleted: false,
    });

    const map = new Map<string, number>();
    for (const p of products) {
      const key = p.category;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const safeThreshold =
      typeof threshold === "number" && Number.isFinite(threshold)
        ? threshold
        : 0;

    if (safeThreshold < 0) {
      throw new AppError(
        "threshold must be greater than or equal to 0",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const products = await this.productRepository.findAll({
      includeDeleted: false,
    });

    return products.filter((p) => p.stock <= safeThreshold);
  }

  async increaseStock(id: string, payload: { quantity?: unknown }): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    const quantity = payload.quantity;
    if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
      throw new AppError(
        "quantity must be a positive integer",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const updated = await this.productRepository.update(id, {
      stock: product.stock + (quantity as number),
      updatedAt: undefined,
    } as UpdateProductInput);

    if (!updated) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return updated;
  }

  async decreaseStock(id: string, payload: { quantity?: unknown }): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    const quantity = payload.quantity;
    if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
      throw new AppError(
        "quantity must be a positive integer",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const newStock = product.stock - (quantity as number);
    if (newStock < 0) {
      throw new AppError(
        "Insufficient stock",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const updated = await this.productRepository.update(id, {
      stock: newStock,
      updatedAt: undefined,
    } as UpdateProductInput);

    if (!updated) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return updated;
  }

  async restoreProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!product.deletedAt) {
      // Already active
      return product;
    }

    const restored = await this.productRepository.update(id, {
      deletedAt: null,
    });

    if (!restored) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return restored;
  }

  async updateProduct(id: string, payload: UpdateProductInput): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    this.validateUpdatePayload(payload);

    if (payload.barcode && payload.barcode !== product.barcode) {
      await this.ensureBarcodeIsUnique(payload.barcode, id);
    }

    let categoryId: number | undefined;
    if (payload.category !== undefined) {
      categoryId = await this.resolveCategoryId(payload.category);
    }

    const updatedProduct = await this.productRepository.update(
      id,
      this.sanitizeUpdatePayload(payload),
      categoryId,
    );

    if (!updatedProduct) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    const deletedProduct = await this.productRepository.update(id, {
      deletedAt: new Date().toISOString(),
    });

    if (!deletedProduct) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return deletedProduct;
  }

  private async ensureBarcodeIsUnique(
    barcode: string,
    currentProductId?: string,
  ): Promise<void> {
    const product = await this.productRepository.findByBarcode(barcode);

    if (product && product.id !== currentProductId && !product.deletedAt) {
      throw new AppError("Barcode already exists", HTTP_STATUS.CONFLICT);
    }
  }

  private async resolveCategoryId(category: string): Promise<number> {
    return this.productRepository.findOrCreateCategoryId(category.trim());
  }

  private sanitizeCreatePayload(payload: CreateProductInput): CreateProductInput {
    return {
      name: payload.name.trim(),
      price: payload.price,
      stock: payload.stock,
      unit: payload.unit.trim(),
      barcode: payload.barcode.trim(),
      category: payload.category.trim(),
    };
  }

  private sanitizeUpdatePayload(payload: UpdateProductInput): UpdateProductInput {
    return {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit.trim() } : {}),
      ...(payload.barcode !== undefined
        ? { barcode: payload.barcode.trim() }
        : {}),
      ...(payload.category !== undefined
        ? { category: payload.category.trim() }
        : {}),
    };
  }

  private validateCreatePayload(payload: CreateProductInput): void {
    if (!payload.name?.trim()) {
      throw new AppError("Product name is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!payload.barcode?.trim()) {
      throw new AppError("Barcode is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!payload.category?.trim()) {
      throw new AppError("Category is required", HTTP_STATUS.BAD_REQUEST);
    }
    if (!payload.unit?.trim()) {
      throw new AppError("Unit is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (payload.price <= 0) {
      throw new AppError(
        "Product price must be greater than zero",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!Number.isInteger(payload.stock) || payload.stock < 0) {
      throw new AppError(
        "Product stock cannot be negative",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  private validateUpdatePayload(payload: UpdateProductInput): void {
    if (Object.keys(payload).length === 0) {
      throw new AppError("At least one field is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Prevent external clients from soft-deleting via PUT
    if (Object.prototype.hasOwnProperty.call(payload, "deletedAt")) {
      throw new AppError(
        "deletedAt cannot be updated. Use DELETE to soft-delete.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (payload.name !== undefined && !payload.name.trim()) {
      throw new AppError("Product name cannot be empty", HTTP_STATUS.BAD_REQUEST);
    }

    if (payload.barcode !== undefined && !payload.barcode.trim()) {
      throw new AppError("Barcode cannot be empty", HTTP_STATUS.BAD_REQUEST);
    }

    if (payload.category !== undefined && !payload.category.trim()) {
      throw new AppError("Category cannot be empty", HTTP_STATUS.BAD_REQUEST);
    }

    if (payload.price !== undefined && payload.price <= 0) {
      throw new AppError(
        "Product price must be greater than zero",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      payload.stock !== undefined &&
      (!Number.isInteger(payload.stock) || payload.stock < 0)
    ) {
      throw new AppError(
        "Product stock cannot be negative",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
}
}
