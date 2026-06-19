import { cartService } from './cart.service';
import { promotionEngine } from './promotions/PromotionEngine';
import { cartRepository } from '../repositories/cart.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

export class CheckoutService {
  async checkout(userId: string) {
    const cart = await cartService.getActiveCart(userId);

    if (cart.items.length === 0) {
      throw new AppError('Cannot checkout an empty cart', 400, 'EMPTY_CART');
    }

    // Run promotion engine
    const { discounts, finalAmount, appliedCampaigns } = await promotionEngine.calculate(cart);

    // Apply totals
    const totalDiscountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
    cart.discount = totalDiscountAmount;
    cart.total = finalAmount;
    cart.status = 'CHECKED_OUT';

    // Save cart state
    await cartRepository.save(cart);

    // Audit Log
    await auditLogRepository.createLog({
      userId: new mongoose.Types.ObjectId(userId),
      action: 'CART_CHECKOUT',
      payload: { cartId: cart._id, finalAmount, appliedCampaigns }
    });

    return {
      subtotal: cart.subtotal,
      discounts,
      finalAmount,
      appliedCampaigns
    };
  }
}

export const checkoutService = new CheckoutService();
