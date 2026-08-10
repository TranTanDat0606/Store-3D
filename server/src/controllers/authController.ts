import { Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { signToken, TOKEN_COOKIE_NAME, tokenCookieOptions } from '../utils/token';
import { User } from '../models';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../middleware/auth';

function setAuthCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE_NAME, token, tokenCookieOptions);
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user } = await authService.register(req.body);
    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);
    return successResponse(res, user, { status: 201, message: 'Đăng ký thành công' });
  }),

  login: asyncHandler(async (req, res) => {
    const { user } = await authService.login(req.body);
    const token = signToken(user._id, user.role);
    setAuthCookie(res, token);
    return successResponse(res, user, { message: 'Đăng nhập thành công' });
  }),

  logout: asyncHandler(async (_req, res) => {
    res.clearCookie(TOKEN_COOKIE_NAME, { httpOnly: true, secure: tokenCookieOptions.secure, sameSite: tokenCookieOptions.sameSite });
    return successResponse(res, null, { message: 'Đăng xuất thành công' });
  }),

  me: asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user!._id);
    if (!user) throw new AppError('Tài khoản không tồn tại', 404);
    return successResponse(res, user);
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        ...(req.body.fullname !== undefined && { fullname: req.body.fullname }),
        ...(req.body.phone !== undefined && { phone: req.body.phone }),
        ...(req.body.address !== undefined && { address: req.body.address }),
        ...(req.body.avatar !== undefined && { avatar: req.body.avatar }),
      },
      { new: true, runValidators: true },
    );
    if (!user) throw new AppError('Tài khoản không tồn tại', 404);
    return successResponse(res, user, { message: 'Cập nhật hồ sơ thành công' });
  }),

  updatePassword: asyncHandler(async (req: AuthRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) throw new AppError('Tài khoản không tồn tại', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 400);

    user.password = newPassword;
    await user.save();

    return successResponse(res, null, { message: 'Đổi mật khẩu thành công' });
  }),
};
