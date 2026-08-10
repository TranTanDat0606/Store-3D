import mongoose, { type Types } from 'mongoose';
import { User, UserRole, type IUser } from '../models';
import { AppError } from '../utils/AppError';
import type { RegisterInput, LoginInput } from '../validators/auth';

export interface SafeUser {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Removes password-sensitive fields before sending the user to the client. */
export function toSafeUser(user: mongoose.Document<IUser> & IUser): SafeUser {
  const doc = user.toObject();
  const { password: _password, comparePassword: _comparePassword, ...safe } = doc;
  void _password;
  void _comparePassword;
  return safe as SafeUser;
}

export class AuthService {
  async register(data: RegisterInput): Promise<{ user: SafeUser }> {
    const email = data.email.toLowerCase().trim();

    const existing = await User.findOne({ email }).select('_id');
    if (existing) {
      throw new AppError('Email này đã được đăng ký', 409);
    }

    const user = await User.create({
      fullname: data.fullname.trim(),
      email,
      password: data.password,
      phone: data.phone || '',
      address: data.address || '',
      role: UserRole.Customer,
    });

    return { user: toSafeUser(user) };
  }

  async login(data: LoginInput): Promise<{ user: SafeUser }> {
    const email = data.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    return { user: toSafeUser(user) };
  }
}

export const authService = new AuthService();
