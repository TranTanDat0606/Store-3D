import { User, UserRole } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';

export class UserService {
  async list(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['fullname', 'email', 'phone'] };
    return apiFeatures(
      User.find(),
      {},
      options,
    );
  }

  async getById(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async updateRole(id: string, role: UserRole) {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async remove(id: string) {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Không tìm thấy người dùng', 404);
    return deleted;
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
