import { Request, Response, NextFunction } from 'express';
import { cartService } from '../../services/cart.service';

export class CartController {
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const itemPayload = req.body;

      const cart = await cartService.ingestItem(userId, itemPayload);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const cart = await cartService.getCachedCart(userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
