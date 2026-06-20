import { Cart, ICart } from './models/Cart';

export class CartRepository {
  async findActiveCartByUserId(userId: string): Promise<ICart | null> {
    return Cart.findOne({ userId, status: 'ACTIVE' }).lean().exec() as unknown as Promise<ICart | null>;
  }

  async createCart(cartData: Partial<ICart>): Promise<ICart> {
    return Cart.create(cartData);
  }

  async updateCart(cartId: string, updateData: Partial<ICart>): Promise<ICart | null> {
    return Cart.findByIdAndUpdate(cartId, updateData, { new: true }).exec();
  }

  async updateCartWithOCC(cartId: string, expectedVersion: number, updateData: any): Promise<ICart | null> {
    const query: any = { _id: cartId };
    if (expectedVersion === 0) {
      query.$or = [{ version: 0 }, { version: { $exists: false } }];
    } else {
      query.version = expectedVersion;
    }

    return Cart.findOneAndUpdate(
      query,
      { $set: updateData, $inc: { version: 1 } },
      { new: true }
    ).exec();
  }
  
  async save(cart: ICart): Promise<ICart> {
    return cart.save();
  }

  async findExpiredActiveCarts(): Promise<ICart[]> {
    return Cart.find({
      expiresAt: { $lte: new Date() },
      status: 'ACTIVE'
    }).exec();
  }
}

export const cartRepository = new CartRepository();
