import { User, IUser } from './models/User';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).lean();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).lean();
  }
}

export const userRepository = new UserRepository();
