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

    return this.productRepository.create(this.sanitizeCreatePayload(payload));
  }

  async getProducts(query: ProductQuery): Promise<Product[]> {
    return this.productRepository.findAll(query);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product || product.deletedAt) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    return product;
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

    const updatedProduct = await this.productRepository.update(
      id,
      this.sanitizeUpdatePayload(payload),
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

  private sanitizeCreatePayload(payload: CreateProductInput): CreateProductInput {
    return {
      name: payload.name.trim(),
      price: payload.price,
      stock: payload.stock,
      barcode: payload.barcode.trim(),
      category: payload.category.trim(),
    };
  }

  private sanitizeUpdatePayload(payload: UpdateProductInput): UpdateProductInput {
    return {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
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
