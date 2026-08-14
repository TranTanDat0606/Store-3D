import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { resolveImageUrl } from '@/lib'

export function CartDrawer() {
  const { items, totalItems, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart()
  const navigate = useNavigate()

  const goToCheckout = () => {
    closeCart()
    navigate('/thanh-toan')
  }

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, closeCart])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-label="Giỏ hàng"
            className="bg-background fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-border/60 shadow-2xl shadow-primary/10 sm:max-w-md dark:border-white/10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* ambient background */}
            <div className="pointer-events-none absolute inset-0">
              <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-24 size-64 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-border/60 px-5 py-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 border-primary/20 text-primary flex size-10 items-center justify-center rounded-xl border">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <p className="text-base font-bold">Giỏ hàng</p>
                  <p className="text-muted-foreground text-xs">
                    Tổng cộng <Badge className="ml-0.5 bg-primary/10 text-primary">{totalItems} sản phẩm</Badge>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCart}
                aria-label="Đóng giỏ hàng"
                className="text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                <X className="size-5" />
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="relative mb-2">
                  <div className="bg-primary/10 border-primary/20 text-primary relative z-10 flex size-20 items-center justify-center rounded-3xl border shadow-xl shadow-primary/10">
                    <ShoppingBag className="size-9" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-2xl" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Giỏ hàng của bạn đang trống</p>
                  <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
                    Khám phá bộ sưu tập mô hình 3D độc đáo và thêm vào giỏ để bắt đầu.
                  </p>
                </div>
                <Button onClick={closeCart} asChild>
                  <Link to="/san-pham" className="group">
                    Khám phá sản phẩm
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="scroll-slim relative flex-1 space-y-3 overflow-y-auto px-5 py-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm dark:border-white/10"
                      >
                        {/* thumbnail glow */}
                        <div className="pointer-events-none absolute -inset-x-1 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                        <Link
                          to={`/san-pham/${item.slug}`}
                          onClick={closeCart}
                          className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-primary/10" />
                          <img
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                            className="relative size-full object-cover"
                          />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/san-pham/${item.slug}`}
                              onClick={closeCart}
                              className="hover:text-primary line-clamp-2 text-sm leading-snug font-medium"
                            >
                              {item.name}
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive -mr-1.5 -mt-1.5 size-7"
                              onClick={() => removeItem(item.productId)}
                              aria-label="Xóa khỏi giỏ"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">{formatCurrency(item.price)} / cái</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/70 p-0.5 dark:border-white/10">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="size-3.5" />
                              </Button>
                            </div>
                            <span className="text-sm font-bold text-primary tabular-nums">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Summary */}
                <div className="relative border-t border-border/60 px-5 py-4 dark:border-white/10">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Tạm tính</span>
                      <span className="text-xl font-bold text-primary tabular-nums">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="size-3.5" />
                      Phí vận chuyển & mã giảm giá sẽ được áp dụng tại bước thanh toán
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={closeCart} asChild>
                      <Link to="/san-pham">Tiếp tục mua</Link>
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 flex-1 text-white shadow-lg shadow-primary/25" onClick={goToCheckout}>
                      <Sparkles className="size-4" />
                      Thanh toán
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}