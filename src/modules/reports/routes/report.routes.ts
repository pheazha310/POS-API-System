import { Router } from 'express';

import { asyncHandler } from '../../../core/utils/async-handler';
import { reportController } from '../controllers/report.controller';

const reportRouter = Router();

reportRouter.get('/daily', asyncHandler(async (req, res) => {
  reportController.getDailyReport(req, res);
}));

reportRouter.get('/monthly', asyncHandler(async (req, res) => {
  reportController.getMonthlyReport(req, res);
}));

export { reportRouter };
