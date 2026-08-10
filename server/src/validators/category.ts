import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục tối thiểu 2 ký tự').max(100, 'Tên danh mục tối đa 100 ký tự'),
  slug: z.string().trim().optional(),
  image: z.string().min(1, 'Hình ảnh danh mục là bắt buộc'),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự').optional().default(''),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
