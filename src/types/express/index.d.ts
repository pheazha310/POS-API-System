import { IAuthTokenPayload } from "../../modules/auth/models/auth.model";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenPayload;
    }
  }
}

export {};
