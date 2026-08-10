import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { wishlistApi } from '@/services'
import type { Product } from '@/types'
import { useAuth } from './AuthContext'

interface WishlistContextValue {
  products: Product[]
  isLoading: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
  moveToCart: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([])
      return
    }
    setIsLoading(true)
    try {
      const wishlist = await wishlistApi.get()
      setProducts(wishlist.products)
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void loadWishlist()
  }, [loadWishlist])

  const isWishlisted = useCallback(
    (productId: string) => products.some((p) => p._id === productId),
    [products]
  )

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) return
      if (isWishlisted(productId)) {
        const wishlist = await wishlistApi.remove(productId)
        setProducts(wishlist.products)
      } else {
        const wishlist = await wishlistApi.add(productId)
        setProducts(wishlist.products)
      }
    },
    [user, isWishlisted]
  )

  const moveToCart = useCallback(async (productId: string) => {
    const result = await wishlistApi.moveToCart(productId)
    setProducts(result.wishlist.products)
  }, [])

  const value = useMemo(
    () => ({ products, isLoading, isWishlisted, toggleWishlist, moveToCart }),
    [products, isLoading, isWishlisted, toggleWishlist, moveToCart]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
