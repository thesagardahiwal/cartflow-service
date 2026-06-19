import { Router } from 'express';
import { cartController } from './cart.controller';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/authMiddleware';
import { cartItemSchema } from '../../validators/cart.validator';

const router = Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', validate(cartItemSchema), cartController.addItem);

export default router;
