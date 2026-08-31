import { useChat as useAiChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AI_CHAT_API } from '@/services/aiChatApi';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const transport = new DefaultChatTransport({
  api: AI_CHAT_API,
  credentials: 'include',
});

const MAX_MESSAGES = 18;
const DEBOUNCE_MS = 500;
const GUEST_SESSION_KEY = 'store3d_guest_session';

function getGuestSessionId(): string {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  } catch {
    return `guest_${Date.now()}`;
  }
}

function getStorageKey(userId?: string): string {
  return userId ? `store3d_chat_${userId}` : `store3d_chat_${getGuestSessionId()}`;
}

function loadMessages(storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
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

function saveMessages(storageKey: string, messages: unknown[]) {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      const toSave = messages.length > MAX_MESSAGES
        ? messages.slice(messages.length - MAX_MESSAGES)
        : messages;
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useChat() {
  const { user } = useAuth();
  const storageKey = getStorageKey(user?._id);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const chatId = useMemo(
    () => `store3d_${user?._id || getGuestSessionId()}`,
    [user?._id],
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<unknown[] | null>(null);

  const flushPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      saveMessages(storageKeyRef.current, pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  const debouncedSave = useCallback((messages: unknown[]) => {
    pendingRef.current = messages;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        saveMessages(storageKeyRef.current, pendingRef.current);
        pendingRef.current = null;
      }
    }, DEBOUNCE_MS);
  }, []);

  const chat = useAiChat({
    id: chatId,
    transport,
    messages: loadMessages(storageKey),
    onFinish: ({ messages }) => {
      flushPending();
      saveMessages(storageKeyRef.current, messages);
    },
  });

  useEffect(() => {
    if (chat.messages.length > 0) {
      debouncedSave(chat.messages);
    }
  }, [chat.messages, debouncedSave]);

  useEffect(() => {
    const handleBeforeUnload = () => flushPending();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushPending]);

  useEffect(() => () => flushPending(), [flushPending]);

  const clearChat = useCallback(() => {
    cancelPending();
    chat.setMessages([]);
    localStorage.removeItem(storageKeyRef.current);
  }, [chat, cancelPending]);

  return { ...chat, clearChat };
}
