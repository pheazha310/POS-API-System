export type ReportSaleSummary = {
  saleId: string;
  soldAt: string;
  paymentMethod: string;
  itemCount: number;
  total: number;
};

export type ReportTotals = {
  salesCount: number;
  itemsSold: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalRevenue: number;
};

export type DailyReport = {
  date: string;
  totals: ReportTotals;
  sales: ReportSaleSummary[];
};

export type MonthlyReport = {
  year: number;
  month: number;
  totals: ReportTotals;
  dailyBreakdown: DailyReport[];
};
