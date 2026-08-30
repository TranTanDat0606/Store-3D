import { useEffect, useState, memo } from 'react'
import { cn } from '@/lib'

interface GameTimerProps {
  duration: number
  onTimeUp: () => void
  onTick?: (remaining: number) => void
  running: boolean
}

export const GameTimer = memo(function GameTimer({ duration, onTimeUp, onTick, running }: GameTimerProps) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    if (!running) return
    setRemaining(duration)
  }, [duration, running])

  useEffect(() => {
    if (!running || remaining <= 0) return
    if (remaining <= 0) {
      onTimeUp()
      return
    }
    onTick?.(remaining)
    const timer = setTimeout(() => {
      setRemaining((r) => {
        if (r <= 1) {
          onTimeUp()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [remaining, running, onTimeUp, onTick])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isLow = remaining <= 10

  return (
    <div className={cn(
      'font-mono text-2xl font-bold tabular-nums transition-colors',
      isLow ? 'text-red-500' : 'text-muted-foreground',
    )}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
})
