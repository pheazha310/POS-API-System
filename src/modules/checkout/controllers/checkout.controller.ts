import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { checkoutService } from '../services/checkout.service';

export class CheckoutController {
  public async createCheckout(req: Request, res: Response): Promise<void> {
    const result = await checkoutService.createCheckout(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(apiResponse(MESSAGES.CHECKOUT_SUCCESS, result));
  }
}

export const checkoutController = new CheckoutController();
