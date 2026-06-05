import { Router } from 'express';

import { HTTP_STATUS } from '../../../constants/http-status';
import { apiResponse } from '../../../core/utils/api-response';
import authMiddleware from '../../auth/middlewares/auth.middleware';

const userRouter = Router();

userRouter.use(authMiddleware.authenticate);
userRouter.use(authMiddleware.authorizeRoles('ADMIN'));

userRouter.get('/', (_req, res) => {
  res.status(HTTP_STATUS.OK).json(apiResponse('Users endpoint is available.', []));
});

export { userRouter };
