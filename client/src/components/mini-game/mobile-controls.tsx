import { useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib'
import { ChevronUp, ChevronDown, Crosshair } from 'lucide-react'

interface MobileControlsProps {
  onAction: (action: 'jump' | 'crouch' | 'crouch_up' | 'shoot') => void
  className?: string
}

function TouchButton({
  children,
  onPress,
  onRelease,
  className,
  label,
}: {
  children: React.ReactNode
  onPress: () => void
  onRelease?: () => void
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
    if (activeRef.current) {
      activeRef.current = false
      onRelease?.()
    }
  }, [onRelease])

  useEffect(() => {
    const cleanup = () => { activeRef.current = false }
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
        'pointer-events-auto flex items-end justify-between gap-3 px-4 pb-3 pt-2',
        'w-full select-none',
        className,
      )}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Left: Jump + Duck */}
      <div className="flex flex-col items-center gap-2">
        <TouchButton
          onPress={() => onAction('jump')}
          className="size-16"
          label="Nhảy"
        >
          <div className="flex flex-col items-center">
            <ChevronUp className="size-6" strokeWidth={3} />
            <span className="text-[8px] font-bold">JUMP</span>
          </div>
        </TouchButton>
        <TouchButton
          onPress={() => onAction('crouch')}
          onRelease={() => onAction('crouch_up')}
          className="size-16"
          label="Ngồi"
        >
          <div className="flex flex-col items-center">
            <ChevronDown className="size-6" strokeWidth={3} />
            <span className="text-[8px] font-bold">DUCK</span>
          </div>
        </TouchButton>
      </div>

      {/* Right: Fire */}
      <div className="flex items-center pb-2">
        <TouchButton
          onPress={() => onAction('shoot')}
          className="size-20 border-cyan-400/40 bg-cyan-500/20 text-cyan-300 active:bg-cyan-500/40"
          label="Bắn"
        >
          <div className="flex flex-col items-center">
            <Crosshair className="size-8" strokeWidth={2.5} />
            <span className="text-[8px] font-bold">FIRE</span>
          </div>
        </TouchButton>
      </div>
    </div>
  )
}
