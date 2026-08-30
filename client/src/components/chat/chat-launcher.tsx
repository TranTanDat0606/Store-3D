import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

function AiChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="ai-bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.9} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* Chat bubble — rounded rectangle with tail */}
      <path
        d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5H8l-3.5 3V17H5.5A1.5 1.5 0 014 15.5z"
        fill="url(#ai-bubble-grad)"
        opacity={0.15}
      />
      <path
        d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5H8l-3.5 3V17H5.5A1.5 1.5 0 014 15.5z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* AI sparkle — inside bubble, top right */}
      <path
        d="M15.5 7.5l0.7-1.4 0.7 1.4 1.4 0.7-1.4 0.7-0.7 1.4-0.7-1.4-1.4-0.7z"
        fill="currentColor"
        opacity={0.7}
      />
      {/* AI neural dots — subtle pattern inside bubble */}
      <circle cx="9" cy="9" r="1" fill="currentColor" opacity={0.4} />
      <circle cx="12.5" cy="10.5" r="0.7" fill="currentColor" opacity={0.3} />
      <circle cx="10" cy="12.5" r="0.6" fill="currentColor" opacity={0.25} />
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
            <AiChatIcon className="size-7" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
