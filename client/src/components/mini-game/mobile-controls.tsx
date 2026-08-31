import { useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib'
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Crosshair } from 'lucide-react'

interface MobileControlsProps {
  onAction: (action: 'left' | 'right' | 'jump' | 'crouch' | 'shoot') => void
  className?: string
}

function TouchButton({
  children,
  onPress,
  className,
  label,
}: {
  children: React.ReactNode
  onPress: () => void
  className?: string
  label: string
}) {
  const activeRef = useRef(false)

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!activeRef.current) {
        activeRef.current = true
        onPress()
      }
    },
    [onPress],
  )

  const handleEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    activeRef.current = false
  }, [])

  useEffect(() => {
    const cleanup = () => {
      activeRef.current = false
    }
    return cleanup
  }, [])

  return (
    <button
      type="button"
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      className={cn(
        'flex items-center justify-center rounded-2xl border-2 border-white/20',
        'bg-white/10 backdrop-blur-sm text-white',
        'active:bg-white/25 active:scale-95 active:border-white/40',
        'transition-all duration-75 select-none touch-none',
        'shadow-lg shadow-black/20',
        className,
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}

export function MobileControls({ onAction, className }: MobileControlsProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-end justify-between gap-2 px-3 pb-2 pt-1',
        'w-full select-none',
        className,
      )}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Left side - Movement + Jump/Crouch */}
      <div className="flex flex-col items-center gap-1.5">
        <TouchButton
          onPress={() => onAction('jump')}
          className="size-14"
          label="Nhảy"
        >
          <ChevronUp className="size-7" strokeWidth={3} />
        </TouchButton>
        <div className="flex gap-1.5">
          <TouchButton
            onPress={() => onAction('left')}
            className="size-14"
            label="Di chuyển trái"
          >
            <ArrowLeft className="size-7" strokeWidth={3} />
          </TouchButton>
          <TouchButton
            onPress={() => onAction('crouch')}
            className="size-14"
            label="Rạp xuống"
          >
            <ChevronDown className="size-7" strokeWidth={3} />
          </TouchButton>
          <TouchButton
            onPress={() => onAction('right')}
            className="size-14"
            label="Di chuyển phải"
          >
            <ArrowRight className="size-7" strokeWidth={3} />
          </TouchButton>
        </div>
      </div>

      {/* Right side - Shoot */}
      <div className="flex items-center pb-2">
        <TouchButton
          onPress={() => onAction('shoot')}
          className="size-20 border-cyan-400/40 bg-cyan-500/20 text-cyan-300 active:bg-cyan-500/40"
          label="Bắn"
        >
          <Crosshair className="size-10" strokeWidth={2.5} />
        </TouchButton>
      </div>
    </div>
  )
}
