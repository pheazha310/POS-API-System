import type { Express } from "express";

import authRoutes from "./auth/routes/auth.routes";
import { cartRouter } from "./cart/routes/cart.routes";
import { checkoutRouter } from "./checkout/routes/checkout.routes";
import { inventoryRouter } from "./inventory/routes/inventory.routes";
import { productRouter } from "./products/routes/product.routes";
import { reportRouter } from "./reports/routes/report.routes";
import { saleRouter } from "./sales/routes/sale.routes";
import { userRouter } from "./users/routes/user.routes";

export const registerModuleRoutes = (app: Express, apiPrefix: string): void => {
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/checkout`, checkoutRouter);
  app.use(`${apiPrefix}/users`, userRouter);
  app.use(`${apiPrefix}/products`, productRouter);
  app.use(`${apiPrefix}/cart`, cartRouter);
  app.use(`${apiPrefix}/inventory`, inventoryRouter);
  app.use(`${apiPrefix}/reports`, reportRouter);
  app.use(`${apiPrefix}/sales`, saleRouter);
};
