import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';

const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Auth endpoint is available.', { routes: ['GET /auth'] }));
});

export { authRouter };
