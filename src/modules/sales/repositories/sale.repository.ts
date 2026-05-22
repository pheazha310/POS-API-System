import type { Sale } from '../models/sale.model';

const sales: Sale[] = [
  {
    id: 'sale_001',
    customer: {
      name: 'Sophea Phal',
      phone: '012345678',
    },
    discount: 1.5,
    items: [
      {
        productId: 'prd_001',
        name: 'Wireless Mouse',
        quantity: 2,
        unitPrice: 12.5,
        lineTotal: 25,
      },
      {
        productId: 'prd_002',
        name: 'Keyboard',
        quantity: 1,
        unitPrice: 18,
        lineTotal: 18,
      },
    ],
    paymentMethod: 'cash',
    soldAt: '2026-05-20T09:15:00.000Z',
    subtotal: 43,
    taxAmount: 2.08,
    taxRate: 5,
    total: 43.58,
  },
  {
    id: 'sale_002',
    customer: {
      name: 'Dara Sok',
    },
    discount: 0,
    items: [
      {
        productId: 'prd_003',
        name: 'Barcode Scanner',
        quantity: 1,
        unitPrice: 55,
        lineTotal: 55,
      },
    ],
    paymentMethod: 'card',
    soldAt: '2026-05-21T14:45:00.000Z',
    subtotal: 55,
    taxAmount: 5.5,
    taxRate: 10,
    total: 60.5,
  },
];

export class SaleRepository {
  public findAll(): Sale[] {
    return sales;
  }

  public findById(id: string): Sale | undefined {
    return sales.find((sale) => sale.id === id);
  }
}

export const saleRepository = new SaleRepository();
