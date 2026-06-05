import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { apiResponse } from '../../../core/utils/api-response';
import { ReportService } from '../services/report.service';

export class ReportController {
  constructor(private readonly service: ReportService = new ReportService()) {}

  public getDailyReport = async (req: Request, res: Response): Promise<void> => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const result = await this.service.getDailyReport(date);

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.DAILY_REPORT_FETCH_SUCCESS, result));
  };

  public getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const year = typeof req.query.year === 'string' ? req.query.year : undefined;
    const result = await this.service.getMonthlyReport(month, year);

    res
      .status(HTTP_STATUS.OK)
      .json(apiResponse(MESSAGES.MONTHLY_REPORT_FETCH_SUCCESS, result));
  };
}

export const reportController = new ReportController();
