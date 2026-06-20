import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

// Protect analytics route
router.use(requireAuth);

router.get('/dashboard', analyticsController.getDashboard);

export default router;
