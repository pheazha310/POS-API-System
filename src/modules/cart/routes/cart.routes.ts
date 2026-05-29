import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';

const cartRouter = Router();

cartRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Cart endpoint is available.', { items: [] }));
});

export { cartRouter };
