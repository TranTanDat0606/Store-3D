import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { resolveImageUrl } from '@/lib'
import { EmptyState } from '@/components/common/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart()
  const navigate = useNavigate()

  const goToCheckout = () => {
    closeCart()
    navigate('/thanh-toan')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent
        className="top-0 right-0 h-full max-w-md translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Giỏ hàng ({items.length})
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={closeCart} aria-label="Đóng">
            <X className="size-5" />
          </Button>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <EmptyState
              title="Giỏ hàng trống"
              description="Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm."
              icon={<ShoppingBag className="size-7" />}
              action={
                <Button onClick={closeCart} asChild>
                  <Link to="/san-pham">Xem sản phẩm</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <Link
                    to={`/san-pham/${item.slug}`}
                    onClick={closeCart}
                    className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  >
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="size-full object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/san-pham/${item.slug}`}
                        onClick={closeCart}
                        className="hover:text-primary line-clamp-2 text-sm font-medium"
                      >
                        {item.name}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Xóa khỏi giỏ"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Tạm tính</span>
                <span className="text-lg font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={closeCart} asChild>
                  <Link to="/san-pham">Tiếp tục mua</Link>
                </Button>
                <Button className="flex-1" onClick={goToCheckout}>
                  Thanh toán
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
