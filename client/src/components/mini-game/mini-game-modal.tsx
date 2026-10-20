import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Miu9FutureRun } from './miu9-future-run'
import { useGameSession } from '@/hooks/useGameSession'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  Gamepad2,
  Loader2,
  Medal,
  Phone,
  X,
  Zap,
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib'
import chestImg from '@/assets/mini-game-chest.jpg'

/** Orbitron accents only (Latin/numeric) — per design system; Vietnamese stays in Be Vietnam Pro. */
const ORBITRON = { fontFamily: "'Orbitron', sans-serif" }

interface MiniGameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

/**
 * Mini-game modal — rebuilt to `.stitch/designs/mini-game-modal.html` (+png),
 * copy VERBATIM: "Mini-game: Đập hộp nhận thưởng" / "LIVE BONUS" /
 * "Tương tác sau đơn hàng • Nhận ưu đãi giới hạn cho lần mua sau" /
 * "Điểm may mắn của bạn:" / "Điểm càng cao, mã giảm giá càng lớn — mỗi đơn
 * hoàn tất chơi 1 lần." / "Chúc mừng Khách hàng!" / "Bạn đã nhận được mã: {code}"
 * / "Mã đã tự động thêm vào Kho mã giảm giá của bạn" / "Sao chép mã"→"Đã chép!"
 * / "Về đơn hàng" / "Xem mã giảm giá".
 *
 * A11y (Plan 2 overlay standards / overlays-spec): role="dialog" + aria-modal
 * via Radix DialogContent (explicit aria-modal like login-prompt-dialog),
 * aria-labelledby = DialogTitle, aria-describedby = DialogDescription, focus
 * trap + Escape close + focus return to the triggering element are Radix-native.
 *
 * PRESERVED logic (C5 — `useGameSession` untouched): session start
 * (`POST /rewards/game/{start|test-start}`) / complete
 * (`POST /rewards/game/complete`) byte-identical, admin test path, reset on
 * close. Reward display is SERVER-driven only: code/discount/expiresAt come
 * from the complete response — no preset values.
 *
 * Honest deviations (logged, Plan 4 T10):
 * - Design's "Bảng phân hạng phần thưởng" table omitted: no endpoint exposes
 *   reward tiers and the screen's demo values (REWARD-5/10/15, 5/10/15%,
 *   30-day expiry) contradict server config (`server/src/config/rewards.ts`:
 *   50→5% … 100→30%, 14-day expiry) — rendering it would mean client-authored
 *   discount values, prohibited by the reward-honesty constraint.
 * - Play action = the mystery chest itself (screen has `cursor-pointer` chest,
 *   no separate play button); its LOCKED/UNLOCKED chip is state-driven.
 * - "Hạn dùng: {n} ngày…" derives n from the server's `reward.expiresAt`
 *   (screen's "30 ngày" is demo copy).
 * - Footer hotline note is §5 settings-driven (hide-on-absent) — the screen's
 *   "1900 1234 (8:30 – 21:00)" is placeholder business info (owner mandate).
 */
export function MiniGameModal({ open, onOpenChange, orderId }: MiniGameModalProps) {
  const { status, result, error, startGame, startTestGame, completeGame, reset } = useGameSession()
  const { user } = useAuth()
  const { settings } = usePublicSettings()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [copied, setCopied] = useState(false)
  const isAdmin = user?.role === 'admin'
  const hotline = settings.hotline?.trim()
  const supportHours = settings.supportHours?.trim()

  /** Plan 2 overlay standard / overlays-spec: focus returns to the element that
   *  opened the modal on close. Mirrors the cart-drawer (Plan 3 T7) pattern —
   *  the dialog is opened programmatically (no DialogTrigger), so Radix has no
   *  trigger reference to restore on its own. */
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setStarted(false)
      setCopied(false)
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

  const handleCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // silent fail (design fallback: system clipboard prompt)
    }
  }, [])

  const goToCoupons = useCallback(() => {
    onOpenChange(false)
    navigate('/tai-khoan/ma-giam-gia')
  }, [navigate, onOpenChange])

  const isPlaying = status === 'playing' && started
  const isDone = status === 'done'
  const isStarting = status === 'starting' || status === 'completing'
  // Mystery-box chip: UNLOCKED while a round can still be started, LOCKED once
  // the round is finished or the server refused (limit reached / error).
  const boxLocked = isDone || Boolean(error)
  const reward = result?.reward ?? null
  // Server truth only — derived from the complete response's expiresAt.
  const expiresInDays = reward
    ? Math.max(1, Math.ceil((new Date(reward.expiresAt).getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-modal="true"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          // Plan 2 overlay standard: return focus to the trigger element.
          event.preventDefault()
          if (triggerRef.current?.isConnected) triggerRef.current.focus()
          triggerRef.current = null
        }}
        className="gap-0 max-h-[90vh] scroll-slim overflow-y-auto rounded-xl border-border bg-card p-0 shadow-2xl sm:max-w-2xl"
      >
        {/* Top decorative gradient accent bar (screen: gold → blue) */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-accent" />

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border bg-background/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-muted text-primary shadow-inner">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-bold tracking-tight sm:text-lg">
                  Mini-game: Đập hộp nhận thưởng
                </DialogTitle>
                <span
                  className="rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent"
                  style={ORBITRON}
                >
                  LIVE BONUS
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Tương tác sau đơn hàng • Nhận ưu đãi giới hạn cho lần mua sau
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            title="Đóng modal"
            aria-label="Đóng modal"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="space-y-6 p-5 sm:p-6">
          {/* GAME STAGE — mystery chest + score pill (screen verbatim structure) */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/80 via-card to-background p-5 text-center sm:p-6">
            {/* Cyber dot grid + radiant light spot (CSS-only per asset rule) */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              {isStarting && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải trò chơi...</p>
                </div>
              )}

              {error && (
                <div className="w-full rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleStart}
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {!isStarting && !error && isPlaying && (
                <div className="w-full">
                  <Miu9FutureRun onGameEnd={handleGameEnd} />
                </div>
              )}

              {!isStarting && !error && !isPlaying && (
                <>
                  {/* 3D mystery chest — the play action (screen: cursor-pointer box) */}
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={boxLocked}
                    aria-label={boxLocked ? 'Hộp quà đã mở' : 'Bắt đầu chơi'}
                    className="group relative mb-4 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
                  >
                    {/* Aura back glow */}
                    <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 opacity-75 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/70 bg-background p-2 shadow-2xl sm:h-32 sm:w-32">
                      <img
                        src={chestImg}
                        alt="Hộp quà bí ẩn obsidian vàng phát laser xanh trong không gian cyberspace"
                        className="h-full w-full object-contain"
                      />
                      {/* State chip (screen's LOCKED / UNLOCKED) */}
                      <span
                        className="absolute bottom-1 rounded border border-border bg-muted/90 px-2 py-0.5 text-[10px] font-semibold text-primary"
                        style={ORBITRON}
                      >
                        {boxLocked ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    </div>
                  </button>

                  {/* Score display counter (Orbitron anchor) */}
                  <div className="mb-2 inline-flex items-center gap-3 rounded-full border border-primary/60 bg-background/90 px-5 py-2 shadow-lg shadow-primary/10">
                    <Zap className="size-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Điểm may mắn của bạn:
                    </span>
                    <span className="text-xl font-extrabold tracking-wider text-primary sm:text-2xl" style={ORBITRON}>
                      {result?.score ?? 0}
                    </span>
                    <span className="text-xs font-bold text-accent/80">/ 100</span>
                  </div>

                  <p className="max-w-md text-xs text-muted-foreground">
                    Điểm càng cao, mã giảm giá càng lớn — mỗi đơn hoàn tất chơi 1 lần.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* RESULT STATE — celebration card (server values only) / honest no-reward state */}
          {isDone && (
            <div className="relative overflow-hidden rounded-xl border border-border bg-background p-4 sm:p-5">
              {reward ? (
                <>
                  <div className="mb-3 flex justify-center sm:justify-start">
                    <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-background shadow">
                      ĐÃ ĐẠT ĐƯỢC - {result?.score} ĐIỂM
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-3.5 text-center sm:text-left">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
                        <Medal className="size-7" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Chúc mừng Khách hàng!
                        </p>
                        <h3 className="text-base font-bold">Bạn đã nhận được mã: {reward.code}</h3>
                        <p className="text-xs font-semibold text-primary">{reward.discount}% GIẢM</p>
                        <p className="text-xs text-muted-foreground">
                          Mã đã tự động thêm vào Kho mã giảm giá của bạn
                        </p>
                      </div>
                    </div>
                    {/* Voucher chip + copy interaction (screen verbatim) */}
                    <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-primary/30 bg-card px-3 py-2 sm:w-auto sm:justify-start">
                      <div className="pl-1 text-sm font-extrabold tracking-widest text-primary sm:text-base" style={ORBITRON}>
                        {reward.code}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(reward.code)}
                        className="flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-bold text-background transition-all hover:brightness-110 active:scale-95"
                      >
                        {copied ? (
                          <>
                            <Check className="size-4" />
                            <span>Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            <span>Sao chép mã</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4 text-accent" />
                      {expiresInDays !== null
                        ? `Hạn dùng: ${expiresInDays} ngày kể từ lúc kích hoạt`
                        : `Hạn dùng: ${formatDateTime(reward.expiresAt)}`}
                    </span>
                    <span className="text-muted-foreground/80">
                      Áp dụng cho mọi đơn hàng mô hình 3D tiếp theo
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm">Bạn chưa đạt đủ điểm để nhận quà.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cần tối thiểu 50 điểm. Thử lại lần sau nhé!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal footer actions (screen verbatim) */}
        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border bg-background px-6 py-4 sm:flex-row">
          {/* Hotline note — §5 settings-driven, hide-on-absent (screen's 1900 1234 is placeholder) */}
          {hotline ? (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Phone className="size-3 text-muted-foreground/60" />
              <span>
                Hotline hỗ trợ: <strong className="font-semibold text-foreground">{hotline}</strong>
                {supportHours ? ` (${supportHours})` : ''}
              </span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              variant="outline"
              className={cn('flex-1 text-xs font-semibold sm:flex-none')}
              onClick={() => onOpenChange(false)}
            >
              Về đơn hàng
            </Button>
            <Button
              className={cn('flex-1 text-xs font-bold shadow-md shadow-primary/20 sm:flex-none')}
              onClick={goToCoupons}
            >
              Xem mã giảm giá
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
