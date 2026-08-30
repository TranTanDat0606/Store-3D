import { useEffect, useState } from 'react'
import { Ticket, Clock, CheckCircle2, XCircle, Copy, Gift } from 'lucide-react'
import { rewardApi } from '@/services/rewardApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { UserCoupon } from '@/types'

function getTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'Hết hạn'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  if (hours > 0) return `Còn ${hours} giờ`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `Còn ${minutes} phút`
}

function getCouponStatus(coupon: UserCoupon): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Ticket } {
  if (coupon.usedAt) return { label: 'Đã sử dụng', variant: 'secondary', icon: CheckCircle2 }
  if (new Date(coupon.expiresAt).getTime() < Date.now()) return { label: 'Hết hạn', variant: 'destructive', icon: XCircle }
  return { label: 'Có thể sử dụng', variant: 'default', icon: Ticket }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<UserCoupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    rewardApi
      .myCoupons()
      .then((data) => {
        if (!cancelled && data) setCoupons(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Đã sao chép mã: ${code}`)
    }).catch(() => {
      toast.error('Không thể sao chép mã')
    })
  }

  const available = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt).getTime() > Date.now())
  const used = coupons.filter((c) => c.usedAt)
  const expired = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt).getTime() <= Date.now())

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Mã giảm giá của tôi</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Mã giảm giá của tôi</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {available.length} mã khả dụng · {used.length} đã dùng · {expired.length} hết hạn
        </p>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-primary/10 mb-4 flex size-16 items-center justify-center rounded-2xl">
              <Gift className="size-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">Chưa có mã giảm giá</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Hoàn thành đơn hàng và chơi mini game để nhận mã giảm giá!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {available.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">Mã khả dụng</h3>
              {available.map((coupon) => {
                const status = getCouponStatus(coupon)
                return (
                  <Card key={coupon._id} className="border-primary/20 overflow-hidden">
                    <div className="flex">
                      <div className="bg-primary/10 flex w-28 flex-col items-center justify-center border-r border-dashed border-primary/30">
                        <span className="text-3xl font-bold text-primary">{coupon.discount}%</span>
                        <span className="text-primary/70 text-xs">giảm giá</span>
                      </div>
                      <CardContent className="flex flex-1 items-center justify-between p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>
                              <status.icon className="mr-1 size-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="font-mono text-lg font-bold tracking-wider">{coupon.code}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="size-3" />
                            {getTimeRemaining(coupon.expiresAt)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copyCode(coupon.code)}>
                          <Copy className="mr-1 size-3" />
                          Sao chép
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {used.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Đã sử dụng</h3>
              {used.map((coupon) => {
                const status = getCouponStatus(coupon)
                return (
                  <Card key={coupon._id} className="opacity-60">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <Badge variant={status.variant}>
                          <status.icon className="mr-1 size-3" />
                          {status.label}
                        </Badge>
                        <p className="font-mono text-sm font-bold tracking-wider">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">Giảm {coupon.discount}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {expired.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Hết hạn</h3>
              {expired.map((coupon) => {
                const status = getCouponStatus(coupon)
                return (
                  <Card key={coupon._id} className="opacity-50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <Badge variant={status.variant}>
                          <status.icon className="mr-1 size-3" />
                          {status.label}
                        </Badge>
                        <p className="font-mono text-sm font-bold tracking-wider line-through">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">Giảm {coupon.discount}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
