import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Package, Star, Gamepad2, X } from 'lucide-react'
import { orderApi } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { formatCurrency, resolveImageUrl } from '@/lib'
import type { Order } from '@/types'

const MiniGameModal = lazy(() =>
  import('@/components/mini-game/mini-game-modal').then((m) => ({ default: m.MiniGameModal })),
)

const SHOWN_KEY = 'store3d-completion-shown'

function getShownOrders(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markOrderShown(id: string) {
  const shown = getShownOrders()
  shown.add(id)
  localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]))
}

export function OrderCompletionModal() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [open, setOpen] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    let cancelled = false
    orderApi
      .mine({ limit: 5 })
      .then((res) => {
        if (cancelled) return
        const shown = getShownOrders()
        const completed = res.data.find(
          (o) => o.status === 'completed' && !shown.has(o._id)
        )
        if (completed) {
          setOrder(completed)
          setOpen(true)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [isAuthenticated, user])

  const handleClose = useCallback(() => {
    if (order) markOrderShown(order._id)
    setOpen(false)
    setOrder(null)
  }, [order])

  const handleViewOrder = useCallback(() => {
    if (order) {
      markOrderShown(order._id)
      navigate(`/tai-khoan/don-hang/${order._id}`)
      setOpen(false)
    }
  }, [order, navigate])

  const handleReview = useCallback(() => {
    if (order) {
      markOrderShown(order._id)
      const firstItem = order.items[0]
      const slug = typeof firstItem?.product === 'object' ? firstItem.product.slug : null
      if (slug) {
        navigate(`/danh-gia/${slug}`)
      } else {
        navigate(`/tai-khoan/don-hang/${order._id}`)
      }
      setOpen(false)
    }
  }, [order, navigate])

  const handlePlayGame = useCallback(() => {
    setGameOpen(true)
  }, [])

  if (!order) return null

  const firstItemImage = order.items[0]?.image

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="sm:max-w-md overflow-hidden border-0 bg-white p-0 shadow-2xl dark:bg-slate-900">
          <div className="relative">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="size-4" />
            </button>

            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-12 text-center text-white">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Đơn hàng hoàn tất!</h2>
              <p className="mt-1 text-sm text-emerald-100">Đơn hàng của bạn đã được giao thành công</p>
            </div>

            <div className="-mt-6 relative z-10 px-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {firstItemImage && (
                      <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        <img src={resolveImageUrl(firstItemImage)} alt="" className="size-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">#{order._id.slice(-8).toUpperCase()}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {order.items.length} sản phẩm · {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2 px-6 pb-6 pt-4">
              <Button onClick={handleViewOrder} className="w-full bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90">
                Xem đơn hàng
              </Button>
              <Button onClick={handleReview} variant="outline" className="w-full">
                <Star className="mr-2 size-4" />
                Đánh giá ngay
              </Button>
              <Button onClick={handlePlayGame} variant="ghost" className="w-full text-primary hover:bg-primary/5">
                <Gamepad2 className="mr-2 size-4" />
                Chơi mini game nhận quà
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        {gameOpen && order && (
          <MiniGameModal
            open={gameOpen}
            onOpenChange={(v) => {
              setGameOpen(v)
              if (!v) handleClose()
            }}
            orderId={order._id}
          />
        )}
      </Suspense>
    </>
  )
}
