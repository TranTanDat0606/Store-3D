import { useCallback, useEffect, useState } from 'react'
import { FrogCatcher } from './frog-catcher'
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
            Mini Game - Frog Robot Fighter
          </DialogTitle>
          <DialogDescription>
            Đánh bại kẻ thù và boss để nhận quà!
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
                <p className="text-lg font-semibold">Sẵn sàng chiến đấu?</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Di chuyển, nhảy, né tránh và bắn kẻ thù!
                  <br />
                  3 trái tim. Điểm càng cao, quà càng lớn!
                </p>
              </div>

              <div className="w-full space-y-3 rounded-lg bg-muted/50 p-3">
                <p className="text-center text-xs font-semibold">Điều khiển</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <span>A/D hoặc ←/→</span><span className="text-right">Di chuyển</span>
                  <span>Space</span><span className="text-right">Nhảy</span>
                  <span>S hoặc ↓</span><span className="text-right">Rạp xuống</span>
                  <span>F</span><span className="text-right">Bắn năng lượng</span>
                </div>
              </div>

              <div className="space-y-0.5 text-center text-xs text-muted-foreground">
                <p>50+ điểm → Giảm 5%</p>
                <p>60+ điểm → Giảm 10%</p>
                <p>70+ điểm → Giảm 15%</p>
                <p>80+ điểm → Giảm 20%</p>
                <p>90+ điểm → Giảm 25%</p>
                <p>100+ điểm → Giảm 30%</p>
              </div>
              <Button onClick={handleStart} size="lg">
                <Gamepad2 className="mr-2 size-4" />
                Bắt đầu chơi
              </Button>
            </div>
          )}

          {isPlaying && (
            <FrogCatcher onGameEnd={handleGameEnd} />
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
