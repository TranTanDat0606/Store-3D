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
      throw error;
    }

    const response = result.toUIMessageStreamResponse();

    const body = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(body);
  }),
};
