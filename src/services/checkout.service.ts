import { cartService } from './cart.service';
import { promotionEngine } from './promotions/PromotionEngine';
import { cartRepository } from '../repositories/cart.repository';
import { AppError } from '../utils/AppError';
import { eventBus } from '../events/eventBus';
import { EVENTS } from '../events/eventTypes';
import { OutboxEvent } from '../repositories/models/OutboxEvent';
import mongoose from 'mongoose';
import { cacheService } from './cache.service';
import { metricsService } from './metrics.service';

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
    const currentVersion = cart.version || 0;

    const savedCart = await cartRepository.updateCartWithOCC(cart._id.toString(), currentVersion, {
      discount: totalDiscountAmount,
      total: finalAmount,
      status: 'CHECKED_OUT'
    });

    if (!savedCart) {
      throw new AppError('Cart was modified by another request.', 409);
    }

    // Invalidate cache
    await cacheService.del(`cart:${userId}`);

    const eventPayload = {
      userId,
      cartId: cart._id,
      finalAmount,
      appliedCampaigns,
      discounts
    };

    // Emit event for real-time listeners (e.g. Audit, Analytics cache)
    eventBus.emit(EVENTS.CHECKOUT_COMPLETED, eventPayload);

    // Store in Outbox for guaranteed delivery/processing by background workers
    await OutboxEvent.create({
      eventType: EVENTS.CHECKOUT_COMPLETED,
      payload: eventPayload,
      processed: false
    });

    metricsService.recordCheckout();
    metricsService.recordPromotionUsage(discounts.length);

    return {
      subtotal: cart.subtotal,
      discounts,
      finalAmount,
      appliedCampaigns
    };
  }
}

export const checkoutService = new CheckoutService();
