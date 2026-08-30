import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

function AiNeuralIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {/* Central diamond / AI core */}
      <path
        d="M12 3.5L18.5 12 12 20.5 5.5 12Z"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {/* Inner diamond — smaller */}
      <path
        d="M12 7L15.8 12 12 17 8.2 12Z"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
        opacity={0.5}
      />
      {/* Center dot — AI core */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Node — top */}
      <circle cx="12" cy="3.5" r="1" fill="currentColor" opacity={0.8} />
      {/* Node — right */}
      <circle cx="18.5" cy="12" r="1" fill="currentColor" opacity={0.8} />
      {/* Node — bottom */}
      <circle cx="12" cy="20.5" r="1" fill="currentColor" opacity={0.8} />
      {/* Node — left */}
      <circle cx="5.5" cy="12" r="1" fill="currentColor" opacity={0.8} />
      {/* Sparkle — top right accent */}
      <path
        d="M20.8 4.2l0.5-1.2 0.5 1.2 1.2 0.5-1.2 0.5-0.5 1.2-0.5-1.2-1.2-0.5z"
        fill="currentColor"
        opacity={0.6}
      />
    </svg>
  );
}

interface ChatLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatLauncher({ isOpen, onToggle }: ChatLauncherProps) {
  return (
    <Button
      onClick={onToggle}
      aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
      className="group fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 sm:bottom-8 sm:right-8"
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
            <AiNeuralIcon className="size-7" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
