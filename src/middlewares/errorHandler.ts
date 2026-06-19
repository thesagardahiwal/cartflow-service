import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn({
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      reqId: req.id,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode || 'APP_ERROR',
    });
  }

  // Handle Mongoose / Zod / other specific errors here if needed
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errorCode: 'VALIDATION_ERROR',
      details: JSON.parse(err.message)
    });
  }

  logger.error({
    message: 'Unhandled Exception',
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    reqId: req.id,
  });

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
};
