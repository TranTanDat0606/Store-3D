import { useCallback, useEffect, useState } from 'react'
import { Miu9FutureRun } from './miu9-future-run'
import { RewardCouponCard } from './reward-coupon-card'
import { useGameSession } from '@/hooks/useGameSession'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Gamepad2 } from 'lucide-react'

interface MiniGameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

export function MiniGameModal({ open, onOpenChange, orderId }: MiniGameModalProps) {
  const { status, result, error, startGame, startTestGame, completeGame, reset } = useGameSession()
  const { user } = useAuth()
  const [started, setStarted] = useState(false)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!open) {
      setStarted(false)
      reset()
    }
  }, [open, reset])

  const handleStart = useCallback(async () => {
    if (isAdmin && !orderId) {
      const res = await startTestGame()
      if (res) setStarted(true)
    } else if (orderId) {
      const res = await startGame(orderId)
      if (res) setStarted(true)
    }
  }, [orderId, startGame, startTestGame, isAdmin])

  const handleGameEnd = useCallback(
    async (score: number) => {
      await completeGame(score)
    },
    [completeGame],
  )

  const isPlaying = status === 'playing' && started
  const isDone = status === 'done'
  const isStarting = status === 'starting' || status === 'completing'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="size-5" />
            MIU-9 Future Run
          </DialogTitle>
          <DialogDescription>
            Bắn hạ kẻ thù, nhận điểm và quà tặng!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isStarting && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Đang tải trò chơi...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleStart}>
                Thử lại
              </Button>
            </div>
          )}

          {!isStarting && !error && !started && !isDone && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-center">
                <p className="text-lg font-semibold">Sẵn sàng chạy?</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Bắn hạ kẻ thù để tích điểm và nhận quà!
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleStart} size="lg">
                  <Gamepad2 className="mr-2 size-4" />
                  {isAdmin && !orderId ? 'Chơi thử' : 'Bắt đầu chơi'}
                </Button>
                {isAdmin && orderId && (
                  <Button onClick={handleStart} variant="outline" size="lg">
                    <Gamepad2 className="mr-2 size-4" />
                    Test Play
                  </Button>
                )}
              </div>
            </div>
          )}

          {isPlaying && (
            <Miu9FutureRun onGameEnd={handleGameEnd} />
          )}

          {isDone && result && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Điểm của bạn</p>
                <p className="text-4xl font-bold">{result.score}</p>
              </div>
              {result.reward ? (
                <RewardCouponCard reward={result.reward} />
              ) : (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm">Bạn chưa đạt đủ điểm để nhận quà.</p>
                  <p className="text-muted-foreground mt-1 text-xs">Cần tối thiểu 50 điểm. Thử lại lần sau nhé!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
