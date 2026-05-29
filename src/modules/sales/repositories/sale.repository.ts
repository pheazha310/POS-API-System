import type { RowDataPacket } from 'mysql2/promise';

import { query } from '../../../config/database';
import type { PaymentMethod } from '../../checkout/models/checkout.model';
import type { Sale, SaleItem } from '../models/sale.model';

type SaleRow = RowDataPacket & {
  id: number;
  total_amount: string | number;
  payment_method: string;
  created_at: Date | string;
};

type SaleItemRow = RowDataPacket & {
  sale_id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: string | number;
  discount: string | number | null;
  total_price: string | number;
};

const toPaymentMethod = (value: string): PaymentMethod => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue === 'card' || normalizedValue === 'mobile') {
    return normalizedValue;
  }

  return 'cash';
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

const seedSales: Sale[] = [
  {
    id: '1',
    customer: {
      name: 'Sophea Phal',
      phone: '012345678',
    },
    discount: 1.5,
    items: [
      {
        productId: '1',
        name: 'Wireless Mouse',
        quantity: 2,
        unitPrice: 12.5,
        lineTotal: 25,
      },
      {
        productId: '2',
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
    id: '2',
    customer: {
      name: 'Dara Sok',
    },
    discount: 0,
    items: [
      {
        productId: '3',
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
  private readonly createdSales: Sale[] = [];

  public async findAll(): Promise<Sale[]> {
    const databaseSales = await this.loadDatabaseSales();

    const baseSales = databaseSales.length > 0 ? databaseSales : seedSales;

    return [...this.createdSales, ...baseSales];
  }

  public async findById(id: string): Promise<Sale | undefined> {
    const normalizedId = id.trim();
    const cachedSale = this.createdSales.find((sale) => sale.id === normalizedId);

    if (cachedSale) {
      return cachedSale;
    }

    const numericId = Number(normalizedId);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      const saleIdMatch = /^sale_(\d+)$/i.exec(normalizedId);

      if (!saleIdMatch) {
        return undefined;
      }

      return this.findByNumericId(Number(saleIdMatch[1]));
    }

    const databaseSale = await this.findByNumericId(numericId);

    if (databaseSale) {
      return databaseSale;
    }

    return seedSales.find((sale) => sale.id === String(numericId));
  }

  public create(payload: Sale): Sale {
    this.createdSales.unshift(payload);
    return payload;
  }

  private async findByNumericId(id: number): Promise<Sale | undefined> {
    try {
      const [salesRows] = await query<SaleRow[]>(
        'SELECT id, total_amount, payment_method, created_at FROM sales WHERE id = ? LIMIT 1',
        [id],
      );

      const saleRow = salesRows[0];

      if (!saleRow) {
        return seedSales.find((sale) => sale.id === String(id));
      }

      const [itemRows] = await query<SaleItemRow[]>(
        `
          SELECT
            si.sale_id,
            si.product_id,
            p.name AS product_name,
            si.quantity,
            si.unit_price,
            si.discount,
            si.total_price
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          WHERE si.sale_id = ?
          ORDER BY si.id ASC
        `,
        [id],
      );

      const items = itemRows.map<SaleItem>((row) => ({
        productId: String(row.product_id),
        name: row.product_name ?? `Product #${row.product_id}`,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price),
        lineTotal: Number(row.total_price),
      }));
      const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
      const total = Number(saleRow.total_amount);

      return {
        id: String(saleRow.id),
        customer: undefined,
        discount: 0,
        items,
        paymentMethod: toPaymentMethod(saleRow.payment_method),
        soldAt: new Date(saleRow.created_at).toISOString(),
        subtotal: subtotal > 0 ? subtotal : total,
        taxAmount: 0,
        taxRate: 0,
        total,
      };
    } catch (_error) {
      return seedSales.find((sale) => sale.id === String(id));
    }
  }

  private async loadDatabaseSales(): Promise<Sale[]> {
    try {
      const [salesRows] = await query<SaleRow[]>(
        'SELECT id, total_amount, payment_method, created_at FROM sales ORDER BY id DESC',
      );

      const [itemRows] = await query<SaleItemRow[]>(
        `
          SELECT
            si.sale_id,
            si.product_id,
            p.name AS product_name,
            si.quantity,
            si.unit_price,
            si.discount,
            si.total_price
          FROM sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          ORDER BY si.sale_id ASC, si.id ASC
        `,
      );

      const itemGroups = new Map<number, SaleItem[]>();

      itemRows.forEach((row) => {
        const saleItems = itemGroups.get(row.sale_id) ?? [];

        saleItems.push({
          productId: String(row.product_id),
          name: row.product_name ?? `Product #${row.product_id}`,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_price),
          lineTotal: Number(row.total_price),
        });

        itemGroups.set(row.sale_id, saleItems);
      });

      return salesRows.map<Sale>((row) => {
        const items = itemGroups.get(row.id) ?? [];
        const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
        const total = Number(row.total_amount);

        return {
          id: String(row.id),
          customer: undefined,
          discount: 0,
          items,
          paymentMethod: toPaymentMethod(row.payment_method),
          soldAt: new Date(row.created_at).toISOString(),
          subtotal: subtotal > 0 ? subtotal : total,
          taxAmount: 0,
          taxRate: 0,
          total,
        };
      });
    } catch (_error) {
      return [];
    }
  }
}

export const saleRepository = new SaleRepository();
