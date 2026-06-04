export type ProductCategory =
  | "supermarket"
  | "beverage"
  | "restaurant"
  | "bakery"
  | "electronics"
  | "other";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  barcode: string;
  category: string;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
  barcode?: string;
  category?: string;
  deletedAt?: string | null;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  includeDeleted?: boolean;
}
