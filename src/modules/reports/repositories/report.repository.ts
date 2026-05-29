import type { Sale } from '../../sales/models/sale.model';
import { saleRepository } from '../../sales/repositories/sale.repository';

export class ReportRepository {
  public async findAllSales(): Promise<Sale[]> {
    return saleRepository.findAll();
  }
}

export const reportRepository = new ReportRepository();
