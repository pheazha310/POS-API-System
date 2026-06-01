import { Router } from 'express';

import { asyncHandler } from '../../../core/utils/async-handler';
import { checkoutController } from '../controllers/checkout.controller';

const checkoutRouter = Router();

checkoutRouter.post('/', asyncHandler(async (req, res) => {
  await checkoutController.createCheckout(req, res);
}));

export { checkoutRouter };
