import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { saleService } from '../services/sale.service';

export class SaleController {
  public async getSales(_req: Request, res: Response): Promise<void> {
    const result = await saleService.getSales();

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.SALES_FETCH_SUCCESS, result));
  }

  public async getSaleById(req: Request, res: Response): Promise<void> {
    const saleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await saleService.getSaleById(saleId ?? '');

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.SALE_FETCH_SUCCESS, result));
  }
}

export const saleController = new SaleController();
