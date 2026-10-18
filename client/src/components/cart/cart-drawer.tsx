import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { resolveImageUrl } from '@/lib'

/** Orbitron accents only (Latin/numeric) — per design system; Vietnamese stays in Be Vietnam Pro. */
const ORBITRON = { fontFamily: "'Orbitron', sans-serif" }

/**
 * Cart drawer — restyled to the approved `cart-drawer` screen (Obsidian Gold).
 *
 * Contract §3 (binding): the subtotal shown here is a CLIENT-SIDE ESTIMATE
 * (stale localStorage price × qty from CartContext) — the server recomputes
 * authoritative totals at order create (checkout = Plan 4). The screen's
 * "Tạm tính" wording is honest provisional labeling and is kept verbatim;
 * NO client-side discount/total math exists or was added.
 *
 * Logic preserved as-is from the previous drawer: open/close (Escape + overlay),
 * qty ± via updateQuantity (min 1 / max stock semantics live in CartContext),
 * removeItem, totalItems badge source, subtotal from context, CTA → '/thanh-toan'.
 *
 * Screen elements intentionally omitted (no honest data source, never fabricated):
 * - Free-shipping progress bar ("Miễn phí toàn quốc" + %) — no shipping-fee
 *   setting/endpoint exists in the app.
 * - Item tag chips ("Resin 8K"/"FDM Pro") + variant line ("Màu: ... • Kích thước: ...")
 *   — CartItem carries no material/variant fields (C5: contexts untouched).
 * - Coupon block ("Mã giảm giá khả dụng: SALE10 / Áp dụng") — Plan 4 scope.
 * - "Đã bao gồm VAT 8%" — unverifiable tax claim on a client estimate (contract §3).
 * The trust line "Thanh toán an toàn: COD hoặc VietQR" IS real (server:
 * PaymentMethod.Cash = COD + VietQR via vietQrService) and is kept verbatim.
 * The screen has no empty state → existing empty-state copy kept (restyled).
 */
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
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          <motion.aside
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Giỏ hàng"
            className="bg-background fixed inset-y-0 right-0 z-50 flex h-screen w-full max-w-[440px] flex-col overflow-hidden border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.85)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className="border-b border-border bg-card/80 px-5 pb-3 pt-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="border-primary/30 bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg border">
                    <ShoppingBag className="size-4" fill="currentColor" />
                  </div>
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                    Giỏ hàng
                    <span
                      style={ORBITRON}
                      className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-base font-extrabold"
                    >
                      ({totalItems})
                    </span>
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeCart}
                  aria-label="Đóng giỏ hàng"
                  className="border-border/50 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted group size-8 rounded-full border"
                >
                  <X className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="border-primary/20 bg-primary/10 text-primary flex size-20 items-center justify-center rounded-xl border">
                  <ShoppingBag className="size-9" />
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
                {/* Item list (scrollable) */}
                <div className="scroll-slim flex-1 space-y-4 overflow-y-auto p-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="group relative rounded-xl border border-border bg-card p-3.5 shadow-md transition-colors hover:border-primary/40"
                      >
                        <div className="flex gap-3.5">
                          <Link
                            to={`/san-pham/${item.slug}`}
                            onClick={closeCart}
                            className="border-border bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg border"
                          >
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <Link
                                to={`/san-pham/${item.slug}`}
                                onClick={closeCart}
                                className="group-hover:text-primary line-clamp-2 text-xs leading-snug font-bold transition-colors"
                              >
                                {item.name}
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive -mr-1 -mt-1 size-11 shrink-0 md:size-9"
                                onClick={() => removeItem(item.productId)}
                                aria-label="Xóa sản phẩm"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                              {formatCurrency(item.price)} / cái
                            </p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <div className="border-border bg-muted flex items-center rounded border p-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground hover:bg-background size-11 rounded md:size-8"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  aria-label="Giảm số lượng"
                                >
                                  <Minus className="size-3.5" />
                                </Button>
                                <span
                                  style={ORBITRON}
                                  className="w-7 text-center text-xs font-bold"
                                >
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-foreground hover:bg-background size-11 rounded md:size-8"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                  aria-label="Tăng số lượng"
                                >
                                  <Plus className="size-3.5" />
                                </Button>
                              </div>
                              <span
                                style={ORBITRON}
                                className="text-primary text-sm font-bold tabular-nums drop-shadow-[0_0_10px_rgba(237,184,76,0.25)]"
                              >
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer: note + subtotal + actions (fixed) */}
                <div className="border-t border-border bg-card/95 px-5 pb-5 pt-5 backdrop-blur-md shadow-2xl">
                  <p className="text-muted-foreground mb-3 flex items-start gap-1.5 text-[11px] leading-tight">
                    <Info className="text-secondary mt-0.5 size-3.5 shrink-0" />
                    Phí vận chuyển &amp; mã giảm giá sẽ được áp dụng tại bước thanh toán.
                  </p>

                  <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
                    <span className="text-foreground text-xs font-semibold tracking-wider uppercase">
                      Tạm tính ({totalItems} sản phẩm)
                    </span>
                    <span
                      style={ORBITRON}
                      className="text-primary text-2xl font-black tabular-nums drop-shadow-[0_0_10px_rgba(237,184,76,0.3)]"
                    >
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(237,184,76,0.35)]"
                      onClick={goToCheckout}
                    >
                      <Lock className="size-4" fill="currentColor" />
                      Tiến hành thanh toán
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground h-10 w-full rounded-lg text-xs font-semibold"
                      onClick={closeCart}
                      asChild
                    >
                      <Link to="/san-pham">
                        <ArrowLeft className="size-3.5" />
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  <div className="border-border/50 mt-4 border-t pt-3">
                    <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[10.5px] leading-tight">
                      <ShieldCheck className="text-primary size-3.5" fill="currentColor" />
                      <span>Thanh toán an toàn: COD hoặc VietQR</span>
                    </div>
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
