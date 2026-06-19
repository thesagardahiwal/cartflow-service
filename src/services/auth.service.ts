import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export class AuthService {
  async register(email: string, passwordPlain: string) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 400, 'EMAIL_IN_USE');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

    const user = await userRepository.create({ email, passwordHash });

    const token = this.generateToken(user._id.toString());

    return { user: { id: user._id, email: user.email }, token };
  }

  async login(email: string, passwordPlain: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user._id.toString());

    return { user: { id: user._id, email: user.email }, token };
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  }
}

export const authService = new AuthService();
