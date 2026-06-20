import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../config/logger';
import { metricsService } from './metrics.service';

class CacheService {
  public client: Redis;

  constructor() {
    this.client = new Redis(env.REDIS_URI, {
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries. Cache will be disabled.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      maxRetriesPerRequest: 1,
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (data) {
        metricsService.recordCacheHit();
        return JSON.parse(data);
      }
      metricsService.recordCacheMiss();
      return null;
    } catch (error) {
      logger.error(`Error fetching cache for key ${key}`, { error });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      logger.error(`Error setting cache for key ${key}`, { error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}`, { error });
    }
  }
}

export const cacheService = new CacheService();
