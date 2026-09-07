import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'

const TOAST_DURATION = 4000
const TOAST_ID = 'add-to-cart'

function AddToCartToast({ message, description }: { message: string; description?: string }) {
  const [progress, setProgress] = useState(100)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100)
      setProgress(pct)
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    const timer = setTimeout(() => {
      toast.dismiss(TOAST_ID)
    }, TOAST_DURATION)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-1">
      <div className="font-medium">{message}</div>
      {description && <div className="text-muted-foreground text-sm">{description}</div>}
      <div className="bg-primary/20 mt-1 h-1 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function toastAddedToCart(name: string) {
  return toast(
    () => <AddToCartToast message="Đã thêm vào giỏ hàng" description={name} />,
    { id: TOAST_ID, duration: TOAST_DURATION },
  )
}
