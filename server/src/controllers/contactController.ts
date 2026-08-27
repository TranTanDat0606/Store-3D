import { Response } from 'express';
import { contactService } from '../services/contactService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { ContactStatus } from '../models/ContactRequest';
import { AuthRequest } from '../middleware/auth';

export const contactController = {
  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await contactService.submit({
      ...req.body,
      userId: req.user?._id,
    });
    return successResponse(res, result, { message: result.message });
  }),

  adminList: asyncHandler(async (req, res: Response) => {
    const { page, limit, status, search } = req.query;
    const result = await contactService.list({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status as string | undefined,
      search: search as string | undefined,
    });
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  adminGetById: asyncHandler(async (req, res: Response) => {
    const contact = await contactService.getById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }
    return successResponse(res, contact);
  }),

  adminUpdateStatus: asyncHandler(async (req, res: Response) => {
    const { status, adminNote } = req.body;
    if (!Object.values(ContactStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    try {
      const contact = await contactService.updateStatus(
        req.params.id,
        status as ContactStatus,
        adminNote
      );
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }
      return successResponse(res, contact);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Không thể chuyển trạng thái' });
    }
  }),

  adminAddNote: asyncHandler(async (req, res: Response) => {
    const { adminNote } = req.body;
    const contact = await contactService.addNote(req.params.id, adminNote || '');
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }
    return successResponse(res, contact);
  }),

  adminCountNew: asyncHandler(async (_req, res: Response) => {
    const count = await contactService.countNew();
    return successResponse(res, { count });
  }),
};
