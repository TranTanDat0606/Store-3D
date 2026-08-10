import { Response } from 'express';
import { categoryService } from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const categoryController = {
  list: asyncHandler(async (req, res: Response) => {
    const result = await categoryService.list(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  all: asyncHandler(async (_req, res: Response) => {
    const categories = await categoryService.all();
    return successResponse(res, categories);
  }),

  getBySlug: asyncHandler(async (req, res: Response) => {
    const category = await categoryService.getBySlug(req.params.slug);
    return successResponse(res, category);
  }),

  create: asyncHandler(async (req, res: Response) => {
    const category = await categoryService.create(req.body);
    return successResponse(res, category, { status: 201, message: 'Tạo danh mục thành công' });
  }),

  update: asyncHandler(async (req, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    return successResponse(res, category, { message: 'Cập nhật danh mục thành công' });
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await categoryService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa danh mục thành công' });
  }),
};
