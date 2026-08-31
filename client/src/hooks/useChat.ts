import { useChat as useAiChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AI_CHAT_API } from '@/services/aiChatApi';
import { useCallback, useState } from 'react';

const transport = new DefaultChatTransport({
  api: AI_CHAT_API,
  credentials: 'include',
});

const STORAGE_KEY = 'store3d_chat_history';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: Record<string, unknown>) =>
        m && typeof m === 'object' && 'role' in m && 'parts' in m && Array.isArray(m.parts),
    );
  } catch {
    return [];
  }
}

function saveMessages(messages: unknown[]) {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useChat() {
  const [chatId] = useState(() => `store3d_${Date.now()}`);
  const chat = useAiChat({
    id: chatId,
    transport,
    messages: loadMessages(),
    onFinish: ({ messages }) => {
      saveMessages(messages);
    },
  });

  const clearChat = useCallback(() => {
    chat.setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [chat]);

  return { ...chat, clearChat };
}
