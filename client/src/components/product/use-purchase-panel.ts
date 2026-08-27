import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { Product } from '@/types'

export interface PurchasePanelState {
  quantity: number
  displayPrice: number
  subtotal: number
  isOutOfStock: boolean
  wishlisted: boolean
  setQuantity: (q: number | ((prev: number) => number)) => void
  handleAddToCart: () => void
  handleBuyNow: () => void
  handleWishlist: () => void
  loginOpen: boolean
  setLoginOpen: (open: boolean) => void
}

export function usePurchasePanel(product: Product | null): PurchasePanelState {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const [quantity, setQuantity] = useState(1)
  const [loginOpen, setLoginOpen] = useState(false)

  const isOutOfStock = (product?.stock ?? 0) <= 0
  const wishlisted = product ? isWishlisted(product._id) : false

  const displayPrice = product?.salePrice ?? 0

  const subtotal = useMemo(() => {
    if (!product) return 0
    return product.salePrice * quantity
  }, [product, quantity])

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product, quantity)
    toast.success('Đã thêm vào giỏ hàng', { description: product.name })
  }

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    addItem(product, 1)
    navigate('/thanh-toan')
  }

  const handleWishlist = async () => {
    if (!product) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    try {
      await toggleWishlist(product._id)
      toast.success(wishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích')
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    }
  }

  return {
    quantity,
    displayPrice,
    subtotal,
    isOutOfStock,
    wishlisted,
    setQuantity,
    handleAddToCart,
    handleBuyNow,
    handleWishlist,
    loginOpen,
    setLoginOpen,
  }
}
