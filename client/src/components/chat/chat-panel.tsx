import { useEffect, useRef } from 'react';
import { X, Bot, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Button } from '@/components/ui/button';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { messages, sendMessage, status, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSend = (text: string) => {
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
  };

  const isStreaming = status === 'streaming' || status === 'submitted';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="chat-overlay"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="chat-panel"
            role="dialog"
            aria-label="AI Chat"
            className="bg-background fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l shadow-2xl sm:bottom-24 sm:right-4 sm:top-auto sm:h-[500px] sm:w-[380px] sm:rounded-2xl sm:border sm:inset-x-auto"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 flex size-8 items-center justify-center rounded-full">
                  <Bot className="text-primary size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Store3D AI</p>
                  <p className="text-muted-foreground text-xs">Trợ lý ảo</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Đóng chat"
                className="size-8"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
                    <MessageSquare className="text-primary size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chào mừng bạn!</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Hỏi tôi bất cứ điều gì về sản phẩm và dịch vụ của Store3D.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
                  Đã có lỗi xảy ra. Vui lòng thử lại.
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} isLoading={isStreaming} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
