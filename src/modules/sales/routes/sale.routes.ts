import { Router } from 'express';

import { asyncHandler } from '../../../core/utils/async-handler';
import authMiddleware from '../../auth/middlewares/auth.middleware';
import { saleController } from '../controllers/sale.controller';

const saleRouter = Router();

saleRouter.use(authMiddleware.authenticate);
saleRouter.use(authMiddleware.authorizeRoles('ADMIN', 'MANAGER'));

saleRouter.get('/', asyncHandler(saleController.getSales));

saleRouter.get('/:id', asyncHandler(saleController.getSaleById));

export { saleRouter };
