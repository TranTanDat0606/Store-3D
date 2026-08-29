import { memo } from 'react'
import { cn } from '@/lib'

interface GameCardProps {
  symbol: string
  isFlipped: boolean
  isMatched: boolean
  onClick: () => void
  disabled: boolean
}

export const GameCard = memo(function GameCard({
  symbol,
  isFlipped,
  isMatched,
  onClick,
  disabled,
}: GameCardProps) {
  const revealed = isFlipped || isMatched

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || revealed}
      aria-label={
        revealed
          ? isMatched
            ? `Đã khớp: ${symbol}`
            : `Đang mở: ${symbol}`
          : 'Thẻ úp, nhấn để lật'
      }
      className={cn(
        'relative aspect-square w-full cursor-pointer rounded-xl transition-transform',
        'active:scale-95 disabled:cursor-default disabled:active:scale-100',
        '[perspective:600px]',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-xl transition-transform duration-500 [transform-style:preserve-3d]',
          revealed && '[transform:rotateY(180deg)]',
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 [backface-visibility:hidden]">
          <div className="text-primary/40 text-3xl font-bold">?</div>
        </div>
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)]',
            isMatched
              ? 'bg-emerald-100 dark:bg-emerald-950'
              : 'bg-card border shadow-sm',
          )}
        >
          <span className="text-4xl select-none">{symbol}</span>
        </div>
      </div>
    </button>
  )
})
