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
productRouter.get("/:id", asyncHandler(productController.getProductById));
productRouter.put("/:id", asyncHandler(productController.updateProduct));
productRouter.delete("/:id", asyncHandler(productController.deleteProduct));
