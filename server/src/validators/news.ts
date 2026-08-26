import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(300),
  excerpt: z.string().trim().max(500).optional().default(''),
  content: z.string().trim().min(1, 'Nội dung là bắt buộc'),
  thumbnail: z.string().optional().default(''),
  category: z.string().trim().optional().default('general'),
  author: z.string().trim().optional().default('Store3D'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const updateNewsSchema = createNewsSchema.partial();

export const newsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
