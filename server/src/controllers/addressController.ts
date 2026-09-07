import { Response } from 'express';
import { addressService } from '../services/addressService';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const addressController = {
  async list(req: AuthRequest, res: Response) {
    const addresses = await addressService.listByUser(req.user!._id);
    return successResponse(res, addresses);
  },

  async getById(req: AuthRequest, res: Response) {
    const address = await addressService.getById(req.params.id, req.user!._id);
    return successResponse(res, address);
  },

  async create(req: AuthRequest, res: Response) {
    const address = await addressService.create({
      userId: req.user!._id,
      ...req.body,
    });
    return successResponse(res, address, { status: 201, message: 'Thêm địa chỉ thành công' });
  },

  async update(req: AuthRequest, res: Response) {
    const address = await addressService.update(req.params.id, req.user!._id, req.body);
    return successResponse(res, address, { message: 'Cập nhật địa chỉ thành công' });
  },

  async remove(req: AuthRequest, res: Response) {
    await addressService.delete(req.params.id, req.user!._id);
    return successResponse(res, null, { message: 'Xóa địa chỉ thành công' });
  },

  async setDefault(req: AuthRequest, res: Response) {
    const address = await addressService.setDefault(req.params.id, req.user!._id);
    return successResponse(res, address, { message: 'Đặt làm mặc định thành công' });
  },
};
