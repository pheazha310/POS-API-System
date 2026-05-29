import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';

const userRouter = Router();

userRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Users endpoint is available.', []));
});

export { userRouter };
