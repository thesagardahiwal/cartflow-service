import { Request, Response, NextFunction } from 'express';
import { Analytics } from '../../repositories/models/Analytics';

class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      // Get the latest analytics snapshot
      const latestAnalytics = await Analytics.findOne().sort({ date: -1 });

      if (!latestAnalytics) {
        return res.status(200).json({
          success: true,
          data: { message: 'Analytics are currently being aggregated.' }
        });
      }

      res.status(200).json({
        success: true,
        data: latestAnalytics
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
