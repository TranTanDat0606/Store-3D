import { z } from 'zod';

export const createReviewSchema = z.object({
  product: z.string().min(1, 'Sản phẩm là bắt buộc'),
  rating: z.coerce.number().int().min(1, 'Đánh giá tối thiểu 1 sao').max(5, 'Đánh giá tối đa 5 sao'),
  comment: z.string().trim().max(1000, 'Bình luận tối đa 1000 ký tự').optional().default(''),
  images: z.array(z.string()).max(5, 'Tối đa 5 hình ảnh').optional().default([]),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional(),
  images: z.array(z.string()).max(5).optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
