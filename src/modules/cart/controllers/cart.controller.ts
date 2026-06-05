import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { CartService } from '../services/cart.service';

export class CartController {
  constructor(private readonly service: CartService = new CartService()) {}

  public getCart = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getCart(this.resolveUserId(req.query.userId));

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_FETCH_SUCCESS, result));
  };

  public addItem = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.addItem(req.body, this.resolveUserId(req.body?.userId));

    res
      .status(HTTP_STATUS.CREATED)
      .json(apiResponse(MESSAGES.CART_ADD_SUCCESS, result));
  };

  public removeItem = async (req: Request, res: Response): Promise<void> => {
    const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.removeItem(
      itemId ?? '',
      this.resolveUserId(req.query.userId ?? req.body?.userId ?? req.params.userId),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_ITEM_REMOVE_SUCCESS, result));
  };

  public clearCart = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.clearCart(this.resolveUserId(req.query.userId));

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.CART_CLEAR_SUCCESS, result));
  };

  private resolveUserId(value: unknown): number | undefined {
    const resolvedValue = Array.isArray(value) ? value[0] : value;

    if (typeof resolvedValue !== 'string' && typeof resolvedValue !== 'number') {
      return undefined;
    }

    const parsed = Number(resolvedValue);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
}

export const cartController = new CartController();
