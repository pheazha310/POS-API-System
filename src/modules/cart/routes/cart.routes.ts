import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../../../core/utils/async-handler';
import { cartController } from '../controllers/cart.controller';

const cartRouter = Router();
const cartRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

cartRouter.use(cartRateLimiter);

cartRouter.get('/', asyncHandler(async (_req, res) => {
  await cartController.getCart(_req, res);
}));

cartRouter.post('/add', asyncHandler(async (req, res) => {
  await cartController.addItem(req, res);
}));

cartRouter.delete('/item/:id', asyncHandler(async (req, res) => {
  await cartController.removeItem(req, res);
}));

cartRouter.post('/clear', asyncHandler(async (_req, res) => {
  await cartController.clearCart(_req, res);
}));

export { cartRouter };
