import { Response } from 'express';
import { statsService } from '../services/statsService';
import { generateRevenueExcel } from '../services/excelExportService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const statsController = {
  overview: asyncHandler(async (_req, res: Response) => {
    const data = await statsService.overview();
    return successResponse(res, data);
  }),

  revenueByDay: asyncHandler(async (req, res: Response) => {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const data = await statsService.revenueByDay(days);
    return successResponse(res, data);
  }),

  revenuePeriod: asyncHandler(async (req, res: Response) => {
    const period = ['day', 'week', 'month', 'year'].includes(String(req.query.period))
      ? (String(req.query.period) as 'day' | 'week' | 'month' | 'year')
      : 'month';
    const data = await statsService.revenueByPeriod(period);
    return successResponse(res, data);
  }),

  bestSelling: asyncHandler(async (req, res: Response) => {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
    const data = await statsService.bestSelling(limit);
    return successResponse(res, data);
  }),

  ordersByStatus: asyncHandler(async (_req, res: Response) => {
    const data = await statsService.ordersByStatus();
    return successResponse(res, data);
  }),

  exportExcel: asyncHandler(async (_req, res: Response) => {
    try {
      const buffer = await generateRevenueExcel();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="store3d-revenue-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      res.send(buffer);
    } catch {
      throw new AppError('Không thể xuất file Excel', 500);
    }
  }),
};
