import { Response } from 'express';
import { generateGameAsset, generateImage } from '../services/geminiService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const geminiController = {
  generateGameAsset: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { assetType } = req.body;
    const result = await generateGameAsset({ assetType });
    return successResponse(res, {
      base64: result.base64,
      mimeType: result.mimeType,
      cached: result.cached,
    });
  }),

  generateImage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prompt, aspectRatio, cacheKey } = req.body;
    const result = await generateImage({ prompt, aspectRatio, cacheKey });
    return successResponse(res, {
      base64: result.base64,
      mimeType: result.mimeType,
      cached: result.cached,
    });
  }),
};
