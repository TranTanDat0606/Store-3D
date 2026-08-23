import { User, UserRole } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';

export class UserService {
  async list(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['fullname', 'email', 'phone'] };
    const result = await apiFeatures(
      User.find(),
      {},
      options,
    );
    const adminCount = await User.countDocuments({ role: UserRole.Admin });
    return { ...result, adminCount };
  }

  async getById(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async updateRole(id: string, role: UserRole) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    // The system must always keep at least one admin account.
    if (user.role === UserRole.Admin && role !== UserRole.Admin) {
      const adminCount = await User.countDocuments({ role: UserRole.Admin });
      if (adminCount <= 1) {
        throw new AppError('Không thể hạ quyền admin cuối cùng của hệ thống', 400);
      }
    }

    user.role = role;
    await user.save();
    return user;
  }

  async remove(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    // The system must always keep at least one admin account.
    if (user.role === UserRole.Admin) {
      const adminCount = await User.countDocuments({ role: UserRole.Admin });
      if (adminCount <= 1) {
        throw new AppError('Không thể xóa admin cuối cùng của hệ thống', 400);
      }
    }

    await user.deleteOne();
    return user;
  }

  async toggleActive(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    user.active = !user.active;
    await user.save();
    return user;
  }
}

export const userService = new UserService();
