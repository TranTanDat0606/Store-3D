import { useCallback, useEffect, useState } from 'react'
import { MemoryMatch } from './memory-match'
import { RewardCouponCard } from './reward-coupon-card'
import { useGameSession } from '@/hooks/useGameSession'
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
  orderId: string
}

export function MiniGameModal({ open, onOpenChange, orderId }: MiniGameModalProps) {
  const { status, result, error, startGame, completeGame, reset } = useGameSession()
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!open) {
      setStarted(false)
      reset()
    }
  }, [open, reset])

  const handleStart = useCallback(async () => {
    const res = await startGame(orderId)
    if (res) setStarted(true)
  }, [orderId, startGame])

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="size-5" />
            Mini Game - Nhận mã giảm giá
          </DialogTitle>
          <DialogDescription>
            Đánh nhanh nhớ nhanh! Tìm các cặp thẻ bài giống nhau để nhận quà.
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
                <p className="text-lg font-semibold">Sẵn sàng chơi?</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Tìm 3 cặp thẻ bài giống nhau trong 60 giây.
                  <br />
                  Điểm càng cao, quà càng lớn!
                </p>
              </div>
              <div className="space-y-1 text-center text-sm">
                <p>100+ điểm → Giảm 30%</p>
                <p>60-99 điểm → Giảm 10%</p>
                <p>50-59 điểm → Giảm 5%</p>
              </div>
              <Button onClick={handleStart} size="lg">
                <Gamepad2 className="mr-2 size-4" />
                Bắt đầu chơi
              </Button>
            </div>
          )}

          {isPlaying && (
            <MemoryMatch onGameEnd={handleGameEnd} />
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
                  <p className="text-muted-foreground mt-1 text-xs">Thử lại lần sau nhé!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
