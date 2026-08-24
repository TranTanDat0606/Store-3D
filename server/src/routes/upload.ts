import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import cloudinary from '../config/cloudinary';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError('Chỉ chấp nhận file ảnh', 400));
  },
});

const router = Router();

router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Vui lòng chọn file ảnh', 400);
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'store3d/products',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      stream.end(req.file!.buffer);
    });

    return successResponse(res, { url: result.secure_url }, { message: 'Tải ảnh thành công' });
  }),
);

export default router;
