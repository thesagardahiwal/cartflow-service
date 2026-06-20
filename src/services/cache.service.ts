import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../config/logger';

class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis(env.REDIS_URI);
    
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
      return data ? JSON.parse(data) : null;
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
