import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn tối đa 2000 ký tự'),
});

export const chatMessageSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'Cần ít nhất một tin nhắn')
    .max(20, 'Tối đa 20 tin nhắn trong một cuộc trò chuyện'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
