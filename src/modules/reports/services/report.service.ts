import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { AppError } from '../../../core/errors/app-error';
import type { Sale } from '../../sales/models/sale.model';
import type { DailyReport, MonthlyReport, ReportSaleSummary, ReportTotals } from '../models/report.model';
import { reportRepository } from '../repositories/report.repository';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toUtcDateKey = (value: string): string => value.slice(0, 10);

const toUtcMonthKey = (value: string): string => value.slice(0, 7);

const roundMoney = (value: number): number => Number(value.toFixed(2));

const buildSaleSummary = (sale: Sale): ReportSaleSummary => ({
  saleId: sale.id,
  soldAt: sale.soldAt,
  paymentMethod: sale.paymentMethod,
  itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
  total: sale.total,
});

const buildTotals = (sales: Sale[]): ReportTotals => {
  return sales.reduce<ReportTotals>(
    (totals, sale) => {
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        salesCount: totals.salesCount + 1,
        itemsSold: totals.itemsSold + itemCount,
        subtotal: roundMoney(totals.subtotal + sale.subtotal),
        discount: roundMoney(totals.discount + sale.discount),
        taxAmount: roundMoney(totals.taxAmount + sale.taxAmount),
        totalRevenue: roundMoney(totals.totalRevenue + sale.total),
      };
    },
    {
      salesCount: 0,
      itemsSold: 0,
      subtotal: 0,
      discount: 0,
      taxAmount: 0,
      totalRevenue: 0,
    },
  );
};

const sortSalesByDate = (sales: Sale[]): Sale[] => {
  return [...sales].sort((left, right) => left.soldAt.localeCompare(right.soldAt));
};

export class ReportService {
  public async getDailyReport(date?: string): Promise<DailyReport> {
    const targetDate = this.resolveDailyDate(date);
    const sales = sortSalesByDate(await reportRepository.findAllSales()).filter((sale) => toUtcDateKey(sale.soldAt) === targetDate);

    return {
      date: targetDate,
      totals: buildTotals(sales),
      sales: sales.map(buildSaleSummary),
    };
  }

  public async getMonthlyReport(month?: string, year?: string): Promise<MonthlyReport> {
    const { targetMonth, targetYear } = this.resolveMonthYear(month, year);
    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const sales = sortSalesByDate(await reportRepository.findAllSales()).filter((sale) => toUtcMonthKey(sale.soldAt) === monthKey);
    const groupedByDay = new Map<string, Sale[]>();

    sales.forEach((sale) => {
      const dateKey = toUtcDateKey(sale.soldAt);
      const existingSales = groupedByDay.get(dateKey) ?? [];
      existingSales.push(sale);
      groupedByDay.set(dateKey, existingSales);
    });

    const dailyBreakdown: DailyReport[] = [...groupedByDay.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([dateKey, daySales]) => ({
        date: dateKey,
        totals: buildTotals(daySales),
        sales: daySales.map(buildSaleSummary),
      }));

    return {
      year: targetYear,
      month: targetMonth,
      totals: buildTotals(sales),
      dailyBreakdown,
    };
  }

  private resolveDailyDate(date?: string): string {
    if (date === undefined) {
      return new Date().toISOString().slice(0, 10);
    }

    if (!DATE_PATTERN.test(date)) {
      throw new AppError(MESSAGES.INVALID_REPORT_DATE, HTTP_STATUS.BAD_REQUEST);
    }

    return date;
  }

  private resolveMonthYear(month?: string, year?: string): { targetMonth: number; targetYear: number } {
    const now = new Date();
    const fallbackMonth = now.getUTCMonth() + 1;
    const fallbackYear = now.getUTCFullYear();

    const targetMonth = month === undefined ? fallbackMonth : Number(month);
    const targetYear = year === undefined ? fallbackYear : Number(year);

    if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      throw new AppError(MESSAGES.INVALID_REPORT_MONTH, HTTP_STATUS.BAD_REQUEST);
    }

    if (!Number.isInteger(targetYear) || String(targetYear).length !== 4) {
      throw new AppError(MESSAGES.INVALID_REPORT_YEAR, HTTP_STATUS.BAD_REQUEST);
    }

    return { targetMonth, targetYear };
  }
}

export const reportService = new ReportService();
