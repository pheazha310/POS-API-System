import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { SaleService } from '../services/sale.service';

export class SaleController {
  constructor(private readonly service: SaleService = new SaleService()) {}

  public getSales = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.getSales();

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.SALES_FETCH_SUCCESS, result));
  };

  public getSaleById = async (req: Request, res: Response): Promise<void> => {
    const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.getSaleById(saleId ?? '');

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.SALE_FETCH_SUCCESS, result));
  };
}

export const saleController = new SaleController();
