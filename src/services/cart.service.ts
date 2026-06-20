import { cartRepository } from '../repositories/cart.repository';
import { ICartItem, ICart } from '../repositories/models/Cart';
import { CartHistory } from '../repositories/models/CartHistory';
import mongoose from 'mongoose';
import { eventBus } from '../events/eventBus';
import { EVENTS } from '../events/eventTypes';
import { cacheService } from './cache.service';
import { AppError } from '../utils/AppError';

export class CartService {
  async getActiveCart(userId: string): Promise<ICart> {
    let cart = await cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      cart = await cartRepository.createCart({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE',
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        expiresAt
      });
      await this.snapshotCart(cart);
    }
    return cart;
  }

  async getCachedCart(userId: string): Promise<any> {
    const cacheKey = `cart:${userId}`;
    const cachedCart = await cacheService.get(cacheKey);
    if (cachedCart) return cachedCart;

    const cart = await this.getActiveCart(userId);
    await cacheService.set(cacheKey, cart);
    return cart;
  }

  async ingestItem(userId: string, itemPayload: ICartItem): Promise<ICart> {
    const cart = await this.getActiveCart(userId);
    const expectedVersion = cart.version || 0;

    const existingItemIndex = cart.items.findIndex(i => i.productId === itemPayload.productId);

    if (existingItemIndex > -1) {
      if (itemPayload.quantity === 0) {
        cart.items.splice(existingItemIndex, 1);
        eventBus.emit(EVENTS.ITEM_REMOVED, { userId, entityId: cart._id, productId: itemPayload.productId });
      } else {
        cart.items[existingItemIndex].quantity += itemPayload.quantity;
        eventBus.emit(EVENTS.ITEM_UPDATED, { userId, entityId: cart._id, productId: itemPayload.productId, quantity: cart.items[existingItemIndex].quantity });
      }
    } else {
      if (itemPayload.quantity > 0) {
        cart.items.push(itemPayload);
        eventBus.emit(EVENTS.ITEM_ADDED, { userId, entityId: cart._id, productId: itemPayload.productId, quantity: itemPayload.quantity });
      }
    }

    this.recalculateSubtotal(cart);

    const savedCart = await cartRepository.updateCartWithOCC(cart._id.toString(), expectedVersion, {
      items: cart.items,
      subtotal: cart.subtotal,
      total: cart.total,
      discount: cart.discount
    });

    if (!savedCart) {
      throw new AppError('Cart was modified by another request.', 409);
    }
    
    await cacheService.del(`cart:${userId}`);
    await this.snapshotCart(savedCart);

    return savedCart;
  }

  private async snapshotCart(cart: ICart) {
    const latestHistory = await CartHistory.findOne({ cartId: cart._id }).sort({ version: -1 });
    const nextVersion = latestHistory ? latestHistory.version + 1 : 1;

    await CartHistory.create({
      cartId: cart._id,
      version: nextVersion,
      snapshot: cart.toObject ? cart.toObject() : cart
    });
  }

  private recalculateSubtotal(cart: ICart) {
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.quantity * item.unitPrice;
    }
    cart.subtotal = subtotal;
    cart.total = subtotal;
    cart.discount = 0;
  }
}

export const cartService = new CartService();
