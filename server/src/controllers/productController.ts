import { Response } from 'express';
import { productService, toObjectId } from '../services/productService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const productController = {
  list: asyncHandler(async (req, res: Response) => {
    const { categorySlug, ...rest } = req.query as Record<string, unknown>;
    const result = categorySlug
      ? await productService.listByCategorySlug(String(categorySlug), rest)
      : await productService.list(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  getBySlug: asyncHandler(async (req, res: Response) => {
    const product = await productService.getBySlug(req.params.slug);
    return successResponse(res, product);
  }),

  related: asyncHandler(async (req, res: Response) => {
    const product = await productService.getById(req.params.id);
    const related = await productService.related(
      String(product._id),
      String(product.category._id),
      Number(req.query.limit) || 4,
    );
    return successResponse(res, related);
  }),

  featured: asyncHandler(async (req, res: Response) => {
    const result = await productService.featured(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    toObjectId(req.body.category);
    const product = await productService.create(req.body);
    return successResponse(res, product, { status: 201, message: 'Tạo sản phẩm thành công' });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.body.category) toObjectId(req.body.category);
    const product = await productService.update(req.params.id, req.body);
    return successResponse(res, product, { message: 'Cập nhật sản phẩm thành công' });
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await productService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa sản phẩm thành công' });
  }),
};
