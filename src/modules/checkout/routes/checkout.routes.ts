import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../../../core/utils/async-handler';
import authMiddleware from '../../auth/middlewares/auth.middleware';
import { checkoutController } from '../controllers/checkout.controller';

const checkoutRouter = Router();
const checkoutRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

checkoutRouter.use(authMiddleware.authenticate);
checkoutRouter.use(authMiddleware.authorizeRoles('ADMIN', 'CASHIER'));
checkoutRouter.use(checkoutRateLimiter);

checkoutRouter.post('/', asyncHandler(checkoutController.createCheckout));

export { checkoutRouter };
