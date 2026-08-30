import { z } from 'zod';

const partSchema = z.object({
  type: z.string(),
  text: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn tối đa 2000 ký tự').optional(),
}).passthrough();

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(2000, 'Tin nhắn tối đa 2000 ký tự').optional(),
  parts: z.array(partSchema).optional(),
}).refine(
  (data) => (data.content && data.content.trim().length > 0) || (data.parts && data.parts.length > 0 && data.parts.some(p => typeof p.text === 'string' && p.text.trim().length > 0)),
  { message: 'Nội dung tin nhắn không được để trống' },
);

export const chatMessageSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'Cần ít nhất một tin nhắn')
    .max(20, 'Tối đa 20 tin nhắn trong một cuộc trò chuyện'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
