import { useChat as useAiChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AI_CHAT_API } from '@/services/aiChatApi';

const transport = new DefaultChatTransport({
  api: AI_CHAT_API,
  credentials: 'include',
});

export function useChat() {
  return useAiChat({
    transport,
  });
}
