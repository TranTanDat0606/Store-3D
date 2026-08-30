import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createChatStream } from '../services/aiChatService';
import { AppError } from '../utils/AppError';

export const aiChatController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    const { messages } = req.body;

    let result;
    try {
      result = await createChatStream({ messages });
    } catch (error) {
      if (error instanceof Error && error.message === 'AI_SERVICE_UNAVAILABLE') {
        throw new AppError('Dịch vụ AI tạm thời không khả dụng', 503);
      }
      console.error('[AIChat] createChatStream error:', error);
      throw error;
    }

    try {
      await result.pipeUIMessageStreamToResponse(res);
    } catch (streamErr: any) {
      console.error('[AIChat] pipeUIMessageStreamToResponse error:', streamErr.message);
      if (!res.headersSent) {
        throw new AppError('Dịch vụ AI tạm thời không khả dụng', 503);
      }
    }
  }),
};
