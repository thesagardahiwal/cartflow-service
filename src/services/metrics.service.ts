import { cacheService } from './cache.service';

export class MetricsService {
  async recordRequest(durationMs: number) {
    try {
      if (cacheService.client.status !== 'ready') return;
      const pipeline = cacheService.client.pipeline();
      pipeline.incr('metrics:requests');
      pipeline.incrby('metrics:total_duration', durationMs);
      await pipeline.exec();
    } catch (e) {
      // Ignore Redis errors
    }
  }

  async recordCheckout() {
    if (cacheService.client.status === 'ready') {
      await cacheService.client.incr('metrics:checkouts');
    }
  }

  async recordCacheHit() {
    if (cacheService.client.status === 'ready') {
      await cacheService.client.incr('metrics:cache_hits');
    }
  }

  async recordCacheMiss() {
    if (cacheService.client.status === 'ready') {
      await cacheService.client.incr('metrics:cache_misses');
    }
  }

  async recordPromotionUsage(count: number = 1) {
    if (cacheService.client.status === 'ready') {
      await cacheService.client.incrby('metrics:promotion_usage', count);
    }
  }

  async getMetrics() {
    if (cacheService.client.status !== 'ready') {
      return { error: 'Redis is not connected' };
    }

    const [requests, checkouts, totalDuration, hits, misses, promos] = await Promise.all([
      cacheService.client.get('metrics:requests'),
      cacheService.client.get('metrics:checkouts'),
      cacheService.client.get('metrics:total_duration'),
      cacheService.client.get('metrics:cache_hits'),
      cacheService.client.get('metrics:cache_misses'),
      cacheService.client.get('metrics:promotion_usage')
    ]);

    const reqCount = parseInt(requests || '0', 10);
    const durTotal = parseInt(totalDuration || '0', 10);
    const hitCount = parseInt(hits || '0', 10);
    const missCount = parseInt(misses || '0', 10);
    
    const avgResponseTime = reqCount > 0 ? durTotal / reqCount : 0;
    const totalCacheRequests = hitCount + missCount;
    const cacheHitRate = totalCacheRequests > 0 ? (hitCount / totalCacheRequests) * 100 : 0;

    return {
      requests: reqCount,
      checkouts: parseInt(checkouts || '0', 10),
      avgResponseTime,
      cacheHitRate,
      promotionUsageCount: parseInt(promos || '0', 10)
    };
  }
}

export const metricsService = new MetricsService();
