import { Router } from 'express';

import { asyncHandler } from '../../../core/utils/async-handler';
import authMiddleware from '../../auth/middlewares/auth.middleware';
import { reportController } from '../controllers/report.controller';

const reportRouter = Router();

reportRouter.use(authMiddleware.authenticate);
reportRouter.use(authMiddleware.authorizeRoles('ADMIN', 'MANAGER'));

reportRouter.get('/daily', asyncHandler(reportController.getDailyReport));

reportRouter.get('/monthly', asyncHandler(reportController.getMonthlyReport));

export { reportRouter };
