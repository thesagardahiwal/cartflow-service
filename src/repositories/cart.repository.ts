import { Cart, ICart } from './models/Cart';

export class CartRepository {
  async findActiveCartByUserId(userId: string): Promise<ICart | null> {
    return Cart.findOne({ userId, status: 'ACTIVE' }).exec();
  }

  async createCart(cartData: Partial<ICart>): Promise<ICart> {
    return Cart.create(cartData);
  }

  async updateCart(cartId: string, updateData: Partial<ICart>): Promise<ICart | null> {
    return Cart.findByIdAndUpdate(cartId, updateData, { new: true }).exec();
  }
  
  async save(cart: ICart): Promise<ICart> {
    return cart.save();
  }
}

export const cartRepository = new CartRepository();
