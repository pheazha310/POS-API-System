import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { cartService } from '../services/cart.service';

export class CartController {
  public async getCart(req: Request, res: Response): Promise<void> {
    const result = await cartService.getCart(this.resolveUserId(req.query.userId));

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_FETCH_SUCCESS, result));
  }

  public async addItem(req: Request, res: Response): Promise<void> {
    const result = await cartService.addItem(req.body, this.resolveUserId(req.body?.userId));

    res
      .status(HTTP_STATUS.CREATED)
      .json(apiResponse(MESSAGES.CART_ADD_SUCCESS, result));
  }

  public async removeItem(req: Request, res: Response): Promise<void> {
    const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await cartService.removeItem(itemId ?? '', this.resolveUserId(req.query.userId));

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_ITEM_REMOVE_SUCCESS, result));
  }

  public async clearCart(req: Request, res: Response): Promise<void> {
    const result = await cartService.clearCart(this.resolveUserId(req.query.userId));

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_CLEAR_SUCCESS, result));
  }

  private resolveUserId(value: unknown): number | undefined {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
}

export const cartController = new CartController();
