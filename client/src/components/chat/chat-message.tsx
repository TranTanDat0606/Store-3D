import { useMemo } from 'react';
import { Bot, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
}

const PRODUCT_LINE_RE = /^\s*[-*]\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+?)\s*→\s*\[.*?\]\((\/san-pham\/[^)]+)\)\s*$/;

function parseProductLines(text: string): { before: string; products: { name: string; price: string; slug: string }[]; after: string }[] {
  const lines = text.split('\n');
  const segments: { before: string; products: { name: string; price: string; slug: string }[]; after: string }[] = [];
  let currentBefore = '';
  let currentProducts: { name: string; price: string; slug: string }[] = [];

  for (const line of lines) {
    const match = line.match(PRODUCT_LINE_RE);
    if (match) {
      currentProducts.push({ name: match[1], price: match[2], slug: match[3] });
    } else {
      if (currentProducts.length > 0) {
        segments.push({ before: currentBefore, products: currentProducts, after: '' });
        currentBefore = '';
        currentProducts = [];
      }
      currentBefore += (currentBefore ? '\n' : '') + line;
    }
  }

  if (currentProducts.length > 0) {
    segments.push({ before: currentBefore, products: currentProducts, after: '' });
  } else if (currentBefore) {
    segments.push({ before: currentBefore, products: [], after: '' });
  }

  return segments;
}

function renderMarkdownText(text: string) {
  const segments = parseProductLines(text);
  return segments.map((seg, si) => (
    <span key={si} className="whitespace-pre-wrap">
      {seg.before}
      {seg.products.length > 0 && (
        <div className="my-2 space-y-2">
          {seg.products.map((p, pi) => (
            <Link
              key={pi}
              to={p.slug}
              className="flex items-center justify-between gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-left transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-cyan-300">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{p.price}</p>
              </div>
              <ExternalLink className="size-3.5 shrink-0 text-cyan-400/60" />
            </Link>
          ))}
        </div>
      )}
    </span>
  ));
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const content = useMemo(() => {
    if (isUser) {
      return message.parts
        .filter((part) => part.type === 'text')
        .map((part, i) => (
          <span key={i} className="whitespace-pre-wrap">
            {part.text}
          </span>
        ));
    }
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part, i) => (
        <span key={i}>{renderMarkdownText(part.text)}</span>
      ));
  }, [message, isUser]);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
