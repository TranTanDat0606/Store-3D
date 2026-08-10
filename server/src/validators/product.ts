import { z } from 'zod';
import { ProductStatus } from '../models';

const materialSchema = z.enum(['PLA', 'PETG', 'ABS', 'Resin'], {
  errorMap: () => ({ message: 'Chất liệu phải là PLA, PETG, ABS hoặc Resin' }),
});
const printerTypeSchema = z.enum(['FDM', 'Resin Printer'], {
  errorMap: () => ({ message: 'Loại máy in phải là FDM hoặc Resin Printer' }),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự').optional().default(''),
  images: z.array(z.string()).min(1, 'Sản phẩm cần ít nhất 1 hình ảnh').max(8, 'Sản phẩm tối đa 8 hình ảnh'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  material: materialSchema,
  printerType: printerTypeSchema,
  size: z.string().trim().max(100, 'Kích thước tối đa 100 ký tự').optional().default(''),
  stock: z.coerce.number().int('Số lượng phải là số nguyên').min(0, 'Tồn kho không được âm').default(0),
  originalPrice: z.coerce.number().min(0, 'Giá gốc không được âm'),
  salePrice: z.coerce.number().min(0, 'Giá bán không được âm'),
  status: z.enum(Object.values(ProductStatus) as [string, ...string[]]).optional(),
  featured: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial().extend({
  slug: z.string().trim().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  categorySlug: z.string().optional(),
  material: z.string().optional(),
  printerType: z.string().optional(),
  status: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
