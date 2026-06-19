import { Router } from 'express';
import { checkoutController } from './checkout.controller';
import { requireAuth } from '../../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

// The requirement specifies GET /api/v1/cart/checkout. 
// We will mount this router under /api/v1/cart
router.get('/checkout', checkoutController.processCheckout);

export default router;
