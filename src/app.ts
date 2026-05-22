import express from 'express';

import { env } from './config/env';
import { HTTP_STATUS } from './constants/http-status';
import { MESSAGES } from './constants/messages';
import { errorHandler } from './core/middlewares/error-handler';
import { notFoundHandler } from './core/middlewares/not-found';
import { checkoutRouter } from './modules/checkout/routes/checkout.routes';
import { saleRouter } from './modules/sales/routes/sale.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.APP_RUNNING,
  });
});

app.use(`${env.apiPrefix}/checkout`, checkoutRouter);
app.use(`${env.apiPrefix}/sales`, saleRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
