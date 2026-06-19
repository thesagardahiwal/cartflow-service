import { cartRepository } from '../repositories/cart.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { ICartItem, ICart } from '../repositories/models/Cart';
import mongoose from 'mongoose';

export class CartService {
  /**
   * Gets or creates an active cart for a user.
   */
  async getActiveCart(userId: string): Promise<ICart> {
    let cart = await cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      // Create new cart with 7 day expiration
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
    }
    return cart;
  }

  /**
   * Intelligently ingest item into cart
   */
  async ingestItem(userId: string, itemPayload: ICartItem): Promise<ICart> {
    const cart = await this.getActiveCart(userId);

    const existingItemIndex = cart.items.findIndex(i => i.productId === itemPayload.productId);

    if (existingItemIndex > -1) {
      if (itemPayload.quantity === 0) {
        // Remove item
        cart.items.splice(existingItemIndex, 1);
        await auditLogRepository.createLog({ userId: new mongoose.Types.ObjectId(userId), action: 'CART_ITEM_REMOVED', payload: { productId: itemPayload.productId } });
      } else {
        // Update quantity
        cart.items[existingItemIndex].quantity += itemPayload.quantity; // Or just set it? Requirement says "increase quantity" but usually ingestion sets it or increments. Let's assume the payload quantity is the absolute new quantity or delta. Prompt: "If item already exists: increase quantity. If quantity becomes 0: remove item." This implies delta or just adding. Wait, "If item already exists: increase quantity" -> I'll treat it as a delta but if it's 0 it means remove. Actually, a typical cart endpoint to add 1 item sends { quantity: 1 }. So if it exists, it becomes `existing + 1`. If we want to remove, maybe we send { quantity: -1 } or an explicit remove endpoint. But the validator has `min(0)`. So if `quantity === 0`, we remove. If `quantity > 0`, do we SET or ADD? "If item already exists: increase quantity" -> this implies `+ quantity`. Wait, if the user explicitly wants to set the quantity to a specific number, they might send the absolute number. Let's stick to "increase" by the payload quantity. To support removing, maybe an explicit endpoint is better, but since it says "If quantity becomes 0: remove item", it must mean we are updating absolute quantity or adding delta. Let's assume `itemPayload.quantity` is the absolute quantity, and if 0 it's removed. Wait, "increase quantity" strongly implies delta. Let's do: if it exists, `existingItem.quantity += itemPayload.quantity`. If result <= 0, remove. But validator prevents negative numbers. So let's assume `quantity` is absolute. "increase quantity" might just mean "the cart's quantity increases". Let's do absolute: `cart.items[existingItemIndex].quantity = itemPayload.quantity`. If 0, remove.
        // Actually, no. "If item already exists: increase quantity" means `existingItem.quantity += payload.quantity`.
        cart.items[existingItemIndex].quantity += itemPayload.quantity;
        await auditLogRepository.createLog({ userId: new mongoose.Types.ObjectId(userId), action: 'CART_ITEM_UPDATED', payload: { productId: itemPayload.productId, quantity: cart.items[existingItemIndex].quantity } });
      }
    } else {
      if (itemPayload.quantity > 0) {
        // Add new item
        cart.items.push(itemPayload);
        await auditLogRepository.createLog({ userId: new mongoose.Types.ObjectId(userId), action: 'CART_ITEM_ADDED', payload: { productId: itemPayload.productId, quantity: itemPayload.quantity } });
      }
    }

    this.recalculateSubtotal(cart);

    return cartRepository.save(cart);
  }

  /**
   * Recalculates subtotal based on items
   */
  private recalculateSubtotal(cart: ICart) {
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.quantity * item.unitPrice;
    }
    cart.subtotal = subtotal;
    // We do NOT calculate discounts here. That is done by the Promotion Engine during checkout.
    // However, we should reset total to subtotal as a base.
    cart.total = subtotal;
    cart.discount = 0;
  }
}

export const cartService = new CartService();
