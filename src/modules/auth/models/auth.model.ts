export interface IUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface IUserPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface IAuthTokenPayload {
  id: number;
  role: string;
  iat?: number;
  exp?: number;
}
