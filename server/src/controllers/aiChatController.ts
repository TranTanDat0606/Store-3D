import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createChatStream } from '../services/aiChatService';
import { AppError } from '../utils/AppError';

export const aiChatController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    const { messages } = req.body;
    const msgCount = Array.isArray(messages) ? messages.length : 0;
    const firstRole = messages?.[0]?.role || 'unknown';
    const hasParts = Array.isArray(messages?.[0]?.parts);
    const rid = Math.random().toString(36).slice(2, 8);

    console.log(`[AI-CHAT-DIAG ${rid}] incoming — msgs=${msgCount}, firstRole=${firstRole}, hasParts=${hasParts}`);

    let result;
    try {
      console.log(`[AI-CHAT-DIAG ${rid}] step=createChatStream`);
      result = await createChatStream({ messages });
      console.log(`[AI-CHAT-DIAG ${rid}] step=createChatStream OK — type=${typeof result}, hasStream=${!!(result as any)?.stream}`);
    } catch (error) {
      const err = error as Error;
      console.error(`[AI-CHAT-DIAG ${rid}] createChatStream FAILED:`, {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 5).join('\n'),
      });
      if (error instanceof Error && error.message === 'AI_SERVICE_UNAVAILABLE') {
        throw new AppError('Dịch vụ AI tạm thời không khả dụng', 503);
      }
      throw error;
    }

    try {
      console.log(`[AI-CHAT-DIAG ${rid}] step=pipeUIMessageStreamToResponse`);
      await result.pipeUIMessageStreamToResponse(res);
      console.log(`[AI-CHAT-DIAG ${rid}] step=pipeUIMessageStreamToResponse OK`);
    } catch (streamErr: any) {
      console.error(`[AI-CHAT-DIAG ${rid}] pipeUIMessageStreamToResponse FAILED:`, {
        name: streamErr?.name,
        message: streamErr?.message,
        stack: streamErr?.stack?.split('\n').slice(0, 3).join('\n'),
        headersSent: res.headersSent,
      });
      if (!res.headersSent) {
        throw new AppError('Dịch vụ AI tạm thời không khả dụng', 503);
      }
    }
  }),
};
