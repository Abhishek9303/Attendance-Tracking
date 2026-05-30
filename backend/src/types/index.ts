import { Request } from 'express';

export interface IUserPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}
