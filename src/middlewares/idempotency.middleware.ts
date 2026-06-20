import { Request, Response, NextFunction } from 'express';
import { IdempotencyRecord } from '../repositories/models/IdempotencyRecord';
import crypto from 'crypto';
import logger from '../config/logger';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  try {
    const endpoint = req.originalUrl;
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');

    const existingRecord = await IdempotencyRecord.findOne({ key: idempotencyKey });

    if (existingRecord) {
      if (existingRecord.requestHash !== requestHash || existingRecord.endpoint !== endpoint) {
        return res.status(400).json({ success: false, error: 'Idempotency key reused with different request payload or endpoint' });
      }

      logger.info(`Idempotency hit for key: ${idempotencyKey}`);
      return res.status(existingRecord.statusCode).json(existingRecord.response);
    }

    // Capture the response before sending
    const originalJson = res.json;
    res.json = function (body) {
      // Restore original json to avoid infinite loop if called internally
      res.json = originalJson;

      // Calculate expiration (e.g. 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save record asynchronously without blocking the response
      IdempotencyRecord.create({
        key: idempotencyKey,
        endpoint,
        requestHash,
        response: body,
        statusCode: res.statusCode,
        expiresAt
      }).catch(err => {
        logger.error(`Failed to save idempotency record for key: ${idempotencyKey}`, { error: err });
      });

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error('Idempotency middleware error', { error });
    next(error);
  }
};
