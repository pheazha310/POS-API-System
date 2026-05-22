import { Router } from 'express';

import { asyncHandler } from '../../../core/utils/async-handler';
import { saleController } from '../controllers/sale.controller';

const saleRouter = Router();

saleRouter.get('/', asyncHandler(async (_req, res) => {
  saleController.getSales(_req, res);
}));

saleRouter.get('/:id', asyncHandler(async (req, res) => {
  saleController.getSaleById(req, res);
}));

export { saleRouter };
