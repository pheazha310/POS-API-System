import { Router } from "express";

import { asyncHandler } from "../../../core/utils/async-handler";
import { ProductController } from "../controllers/product.controller";
import { ProductRepository } from "../repositories/product.repository";
import { ProductService } from "../services/product.service";

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

export const productRouter = Router();

productRouter.post("/", asyncHandler(productController.createProduct));
productRouter.get("/", asyncHandler(productController.getProducts));

// Static routes must be declared before dynamic :id routes so they match correctly.
productRouter.get(
  "/barcodes/:barcode",
  asyncHandler(productController.getProductByBarcode),
);
productRouter.get(
  "/categories",
  asyncHandler(productController.getProductCategories),
);
productRouter.get(
  "/low-stock",
  asyncHandler(productController.getLowStockProducts),
);

productRouter.get("/:id", asyncHandler(productController.getProductById));
productRouter.put("/:id", asyncHandler(productController.updateProduct));
productRouter.delete("/:barcode", asyncHandler(productController.deleteProduct));
productRouter.post(
  "/:id/stock/increase",
  asyncHandler(productController.increaseStock),
);
productRouter.post(
  "/:id/stock/decrease",
  asyncHandler(productController.decreaseStock),
);
productRouter.post(
  "/:id/restore",
  asyncHandler(productController.restoreProduct),
);
