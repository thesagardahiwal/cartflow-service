import { Router } from 'express';
import { checkoutController } from './checkout.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

// Use POST for checkout since it mutates state and requires idempotency
router.post('/', checkoutController.processCheckout);

export default router;
