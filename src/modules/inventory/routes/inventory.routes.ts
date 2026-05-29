import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';

const inventoryRouter = Router();

inventoryRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Inventory endpoint is available.', []));
});

export { inventoryRouter };
