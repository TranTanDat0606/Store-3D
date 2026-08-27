import { z } from 'zod';

export const contactSchema = z.object({
  fullname: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ').max(100),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, 'Số điện thoại không hợp lệ'),
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(1000),
});

export type ContactInput = z.infer<typeof contactSchema>;
