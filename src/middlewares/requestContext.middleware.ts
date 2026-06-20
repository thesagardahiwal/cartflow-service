import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

export interface RequestContext {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestId = () => {
  const store = requestContext.getStore();
  return store ? store.requestId : undefined;
};

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.id = requestId; // Fallback compatibility

  requestContext.run({ requestId }, () => {
    next();
  });
};
