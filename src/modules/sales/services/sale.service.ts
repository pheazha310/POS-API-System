import { HTTP_STATUS } from '../../../constants/http-status';
import { MESSAGES } from '../../../constants/messages';
import { AppError } from '../../../core/errors/app-error';
import type { Sale } from '../models/sale.model';
import { saleRepository } from '../repositories/sale.repository';

export interface SaleRepositoryPort {
  findAll(): Promise<Sale[]>;
  findById(id: string): Promise<Sale | undefined>;
}

export class SaleService {
  constructor(private readonly repository: SaleRepositoryPort = saleRepository) {}

  public async getSales(): Promise<Sale[]> {
    return this.repository.findAll();
  }

  public async getSaleById(id: string): Promise<Sale> {
    const saleId = id.trim();

    if (!saleId) {
      throw new AppError(MESSAGES.SALE_ID_REQUIRED, HTTP_STATUS.BAD_REQUEST);
    }

    const sale = await this.repository.findById(saleId);

    if (!sale) {
      throw new AppError(MESSAGES.SALE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return sale;
  }
}

export const saleService = new SaleService();
