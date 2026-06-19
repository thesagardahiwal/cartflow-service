import { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../../services/checkout.service';

export class CheckoutController {
  async processCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const summary = await checkoutService.checkout(userId);
      res.status(200).json(summary); // Returning EXACT format specified in requirements
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
