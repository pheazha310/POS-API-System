import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { CheckoutService } from '../services/checkout.service';

export class CheckoutController {
  constructor(private readonly service: CheckoutService = new CheckoutService()) {}

  public createCheckout = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.createCheckout(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(apiResponse(MESSAGES.CHECKOUT_SUCCESS, result));
  };
}

export const checkoutController = new CheckoutController();
