import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Lock, LogIn, Truck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LoginPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Login prompt (gatekeeper) — copy VERBATIM from `.stitch/designs/overlays-spec.html`
 * TILE 03 "Yêu Cầu Đăng Nhập (Compact Auth Dialog)", 360px, role="dialog" + focus trap
 * via Radix (Plan 2 overlay standards: aria-modal/Escape/focus return).
 *
 * Primary action hands off to login carrying `state.from = pathname + search`;
 * GuestOnlyRoute (Plan 4 T1) owns the post-login return redirect.
 */
export function LoginPromptDialog({ open, onOpenChange }: LoginPromptDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goToLogin = () => {
    onOpenChange(false)
    navigate('/dang-nhap', { state: { from: location.pathname + location.search } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-modal="true" className="gap-0 rounded-xl sm:max-w-[360px] text-center">
        {/* Lock icon badge (overlays-spec: gold ambient halo container) */}
        <div className="border-primary/40 bg-muted mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border shadow-inner">
          <Lock className="text-primary size-6" />
        </div>

        <DialogHeader className="gap-2 sm:text-center">
          <DialogTitle className="text-foreground text-lg font-bold">Đăng nhập để tiếp tục</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Vui lòng đăng nhập tài khoản Khách hàng{' '}
            <span className="text-primary font-semibold">STORE 3D</span> để lưu mô hình vào danh sách yêu thích và nhận cập
            nhật tiến độ in 3D theo thời gian thực.
          </DialogDescription>
        </DialogHeader>

        {/* Quick feature pills (overlays-spec verbatim) */}
        <div className="my-5 grid grid-cols-2 gap-2 text-left text-[11px]">
          <div className="bg-muted/50 text-foreground flex items-center gap-1.5 rounded border p-2">
            <Heart className="text-primary size-3.5 shrink-0" />
            <span>Lưu wishlist mô hình</span>
          </div>
          <div className="bg-muted/50 text-foreground flex items-center gap-1.5 rounded border p-2">
            <Truck className="text-accent size-3.5 shrink-0" />
            <span>Theo dõi tiến độ đơn</span>
          </div>
        </div>

        {/* Action cluster (overlays-spec verbatim) */}
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:justify-stretch">
          <Button onClick={goToLogin} className="w-full shadow-md shadow-primary/15">
            <LogIn className="size-4" />
            Đăng nhập ngay
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground w-full text-xs font-semibold"
          >
            Đóng / Tiếp tục duyệt sản phẩm
          </Button>
        </DialogFooter>

        {/* Register note (overlays-spec verbatim) */}
        <p className="border-t mt-4 pt-3 text-[11px] text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            to="/dang-ky"
            onClick={() => onOpenChange(false)}
            className="text-primary font-semibold hover:underline"
          >
            Tạo tài khoản mới
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
