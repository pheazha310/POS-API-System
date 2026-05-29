import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';

const productRouter = Router();

productRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Products endpoint is available.', []));
});

export { productRouter };
