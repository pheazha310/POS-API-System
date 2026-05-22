import { Request, Response } from "express";

import { HTTP_STATUS } from "../../../constants/http-status";
import { MESSAGES } from "../../../constants/messages";
import { createSuccessResponse } from "../../../core/utils/api-response";
import { ProductService } from "../services/product.service";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  private getRouteId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.createProduct(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(createSuccessResponse(MESSAGES.PRODUCT_CREATED, product));
  };

  getProducts = async (req: Request, res: Response): Promise<void> => {
    const products = await this.productService.getProducts({
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      category:
        typeof req.query.category === "string" ? req.query.category : undefined,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCTS_FETCHED, products));
  };

  getProductById = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.getProductById(this.getRouteId(req));

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_FETCHED, product));
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.updateProduct(
      this.getRouteId(req),
      req.body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_UPDATED, product));
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.deleteProduct(this.getRouteId(req));

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_DELETED, product));
  };
}
