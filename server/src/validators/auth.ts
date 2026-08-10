import { z } from 'zod';
import { UserRole } from '../models';

const phoneRegex = /^[0-9+\-\s]{8,15}$/;
const emailSchema = z.string().email('Email không hợp lệ').max(100);

export const registerSchema = z.object({
  fullname: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100, 'Họ và tên tối đa 100 ký tự'),
  email: emailSchema,
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(100, 'Mật khẩu tối đa 100 ký tự'),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Địa chỉ tối đa 500 ký tự').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const updateProfileSchema = z.object({
  fullname: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(100).optional(),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  avatar: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự').max(100),
});

export const adminCreateUserSchema = z.object({
  fullname: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(100),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  role: z.enum([UserRole.Admin, UserRole.Customer]).optional(),
  address: z.string().trim().max(500).optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
