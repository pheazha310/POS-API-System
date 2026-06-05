import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';
import authMiddleware from '../../auth/middlewares/auth.middleware';

const inventoryRouter = Router();

inventoryRouter.use(authMiddleware.authenticate);
inventoryRouter.use(authMiddleware.authorizeRoles('ADMIN'));

inventoryRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Inventory endpoint is available.', []));
});

export { inventoryRouter };
