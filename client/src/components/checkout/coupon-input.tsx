import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, Check, Gamepad2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib'
import type { EligibleCoupon, Coupon } from '@/types'

interface CouponInputProps {
  coupons: EligibleCoupon[]
  loading: boolean
  appliedCoupon: Coupon | EligibleCoupon | null
  discount: number
  applying: boolean
  onApply: (code: string) => Promise<void>
  onRemove: () => void
}

const MAX_VISIBLE_COUPONS = 6

export function CouponInput({
  coupons,
  loading,
  appliedCoupon,
  discount: _discount,
  applying,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return coupons
    const q = query.toLowerCase()
    return coupons.filter((c) => c.code.toLowerCase().includes(q))
  }, [coupons, query])

  const shouldScroll = filtered.length > MAX_VISIBLE_COUPONS

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query])

  const scrollToItem = useCallback((index: number) => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-coupon-item]')
    items[index]?.scrollIntoView({ block: 'nearest' })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = prev < filtered.length - 1 ? prev + 1 : 0
          scrollToItem(next)
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filtered.length - 1
          scrollToItem(next)
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          const coupon = filtered[highlightedIndex]
          if (coupon.isApplicable) {
            setQuery(coupon.code)
            onApply(coupon.code)
          }
        } else if (query.trim()) {
          onApply(query.trim())
        }
        break
      case 'Escape':
        e.preventDefault()
        inputRef.current?.blur()
        break
    }
  }

  const handleApplySuggestion = (coupon: EligibleCoupon) => {
    if (!coupon.isApplicable) return
    onApply(coupon.code)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setQuery(val)
  }

  // ── Applied state ──
  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/50">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {appliedCoupon.code}
          </span>
          {appliedCoupon && 'source' in appliedCoupon && appliedCoupon.source === 'game' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
              <Gamepad2 className="size-2.5" />
              Game
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          aria-label="Bỏ mã giảm giá"
          className="ml-2 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-emerald-100 hover:text-red-600 dark:hover:bg-emerald-900"
        >
          Bỏ mã
        </button>
      </div>
    )
  }

  // ── Default state ──
  return (
    <div className="space-y-3">
      {/* Search + Apply */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Nhập mã giảm giá..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="h-9 pl-8 pr-3 text-sm"
            autoComplete="off"
          />
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-9 shrink-0 px-4"
          onClick={() => {
            if (query.trim()) {
              onApply(query.trim())
            }
          }}
          disabled={applying || !query.trim()}
        >
          {applying ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            'Áp dụng'
          )}
        </Button>
      </div>

      {/* Coupon List */}
      <div
        ref={listRef}
        className={cn('space-y-1.5', shouldScroll && 'max-h-[216px] overflow-y-auto')}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Đang tải...
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-muted-foreground py-0.5 text-[11px] font-medium">
              Mã có thể sử dụng ({filtered.filter((c) => c.isApplicable).length})
            </p>
            {filtered.map((c, idx) => (
              <div
                key={c._id}
                data-coupon-item
                className={cn(
                  'rounded-lg border border-border/60 bg-background px-3 py-2 transition-colors',
                  c.isApplicable
                    ? 'hover:border-primary/30 hover:bg-primary/5'
                    : 'opacity-50',
                  idx === highlightedIndex && 'bg-primary/5'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tracking-wide text-foreground">
                        {c.code}
                      </span>
                      {c.source === 'game' && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                          <Gamepad2 className="size-2.5" />
                          Game
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.type === 'percent'
                        ? `Giảm ${c.discount}%`
                        : `Giảm ${formatCurrency(c.discount)}`}
                      {c.estimatedDiscountAmount > 0 && (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                          (≈ -{formatCurrency(c.estimatedDiscountAmount)})
                        </span>
                      )}
                    </p>
                    {!c.isApplicable && c.reason && (
                      <p className="mt-0.5 text-[11px] text-destructive">{c.reason}</p>
                    )}
                  </div>
                  {c.isApplicable && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 shrink-0 px-3 text-xs"
                      onClick={() => handleApplySuggestion(c)}
                      disabled={applying}
                    >
                      Dùng
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : query.trim() ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            Xin lỗi, không có mã giảm giá này.
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            Bạn chưa có mã giảm giá khả dụng.
          </div>
        ) : null}
      </div>
    </div>
  )
}
