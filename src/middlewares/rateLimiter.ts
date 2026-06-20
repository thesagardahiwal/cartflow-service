import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const apiLimiter = async (req: Request, res: Response, next: NextFunction) => {
  let identifier = req.ip;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded.id) {
        identifier = decoded.id;
      }
    } catch (e) {
      // Ignore
    }
  }

  const key = `rate:${identifier}`;
  const limit = 100;
  const windowSeconds = 60;

  try {
    if (cacheService.client.status !== 'ready') return next();
    const currentCount = await cacheService.client.incr(key);
    
    if (currentCount === 1) {
      await cacheService.client.expire(key, windowSeconds);
    }

    if (currentCount > limit) {
      const ttl = await cacheService.client.ttl(key);
      res.setHeader('Retry-After', ttl);
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
  } catch (error) {
    next();
  }
};
