import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ChatLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatLauncher({ isOpen, onToggle }: ChatLauncherProps) {
  return (
    <Button
      onClick={onToggle}
      aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg shadow-primary/25 sm:bottom-8 sm:right-8"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="size-6" />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MessageCircle className="size-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
