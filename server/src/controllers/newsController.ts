import { Response } from 'express';
import { newsService } from '../services/newsService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const newsController = {
  list: asyncHandler(async (req, res: Response) => {
    const result = await newsService.list(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  getBySlug: asyncHandler(async (req, res: Response) => {
    const news = await newsService.getBySlug(req.params.slug);
    return successResponse(res, news);
  }),

  categories: asyncHandler(async (_req, res: Response) => {
    const categories = await newsService.getCategories();
    return successResponse(res, categories);
  }),

  adminList: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await newsService.adminList(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  adminGetById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.getById(req.params.id);
    return successResponse(res, news);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.create(req.body);
    return successResponse(res, news, { status: 201, message: 'Tạo bài viết thành công' });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.update(req.params.id, req.body);
    return successResponse(res, news, { message: 'Cập nhật bài viết thành công' });
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await newsService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa bài viết thành công' });
  }),
};
