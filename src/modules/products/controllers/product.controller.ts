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

  private getRouteBarcode(req: Request): string {
    return Array.isArray(req.params.barcode)
      ? req.params.barcode[0]
      : req.params.barcode;
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
      includeDeleted:
        typeof req.query.includeDeleted === "string"
          ? req.query.includeDeleted === "true"
          : undefined,
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

  // GET /barcodes/:barcode
  getProductByBarcode = async (req: Request, res: Response): Promise<void> => {
    const barcode = Array.isArray(req.params.barcode)
      ? req.params.barcode[0]
      : req.params.barcode;

    const product = await this.productService.getProductByBarcode(barcode);

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_FETCHED, product));
  };

  // GET /categories
  getProductCategories = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const categories = await this.productService.getProductCategories();

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCTS_FETCHED, categories));
  };

  // GET /low-stock?threshold=10
  getLowStockProducts = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const thresholdRaw = req.query.threshold;
    const threshold =
      typeof thresholdRaw === "string" ? Number(thresholdRaw) : undefined;

    const products = await this.productService.getLowStockProducts(threshold);

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCTS_FETCHED, products));
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

  // POST /:id/stock/increase { quantity }
  increaseStock = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.increaseStock(
      this.getRouteId(req),
      req.body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_UPDATED, product));
  };

  // POST /:id/stock/decrease { quantity }
  decreaseStock = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.decreaseStock(
      this.getRouteId(req),
      req.body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_UPDATED, product));
  };

  // POST /:id/restore
  restoreProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.restoreProduct(this.getRouteId(req));

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_UPDATED, product));
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.deleteProduct(this.getRouteBarcode(req));

    res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse(MESSAGES.PRODUCT_DELETED, product));
  };
}
