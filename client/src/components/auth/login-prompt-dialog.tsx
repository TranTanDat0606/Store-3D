import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
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

export function LoginPromptDialog({ open, onOpenChange }: LoginPromptDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goToLogin = () => {
    onOpenChange(false)
    navigate('/dang-nhap', { state: { from: location.pathname + location.search } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vui lòng đăng nhập</DialogTitle>
          <DialogDescription>
            Đăng nhập để thêm sản phẩm vào giỏ hàng và hoàn tất mua sắm.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={goToLogin}>
            <LogIn className="size-4" />
            Đăng nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}