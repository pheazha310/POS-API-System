import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./core/middlewares/error-handler";
import { notFoundHandler } from "./core/middlewares/not-found";
import authRoutes from "./modules/auth/routes/auth.routes";
import { cartRouter } from "./modules/cart/routes/cart.routes";
import { checkoutRouter } from "./modules/checkout/routes/checkout.routes";
import { inventoryRouter } from "./modules/inventory/routes/inventory.routes";
import { productRouter } from "./modules/products/routes/product.routes";
import { reportRouter } from "./modules/reports/routes/report.routes";
import { saleRouter } from "./modules/sales/routes/sale.routes";
import { userRouter } from "./modules/users/routes/user.routes";

const app = express();
const cors = require("cors");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ status: "server is running" });
});

app.use(`${env.apiPrefix}/auth`, authRoutes);
app.use(`${env.apiPrefix}/checkout`, checkoutRouter);
app.use(`${env.apiPrefix}/users`, userRouter);
app.use(`${env.apiPrefix}/products`, productRouter);
app.use(`${env.apiPrefix}/cart`, cartRouter);
app.use(`${env.apiPrefix}/inventory`, inventoryRouter);
app.use(`${env.apiPrefix}/reports`, reportRouter);
app.use(`${env.apiPrefix}/sales`, saleRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
