import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../../../core/utils/async-handler';
import authMiddleware from '../../auth/middlewares/auth.middleware';
import { cartController } from '../controllers/cart.controller';

const cartRouter = Router();
const cartRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

cartRouter.use(authMiddleware.authenticate);
cartRouter.use(authMiddleware.authorizeRoles('ADMIN', 'CASHIER'));
cartRouter.use(cartRateLimiter);

cartRouter.get('/', asyncHandler(cartController.getCart));

cartRouter.post('/add', asyncHandler(cartController.addItem));

cartRouter.delete('/item/:id', asyncHandler(cartController.removeItem));

cartRouter.post('/clear', asyncHandler(cartController.clearCart));

export { cartRouter };
