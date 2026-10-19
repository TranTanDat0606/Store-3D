import { lazy, Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/CartContext'

const CartDrawer = lazy(() => import('@/components/cart/cart-drawer').then(m => ({ default: m.CartDrawer })))
const ChatLauncher = lazy(() => import('@/components/chat/chat-launcher').then(m => ({ default: m.ChatLauncher })))
const ChatPanel = lazy(() => import('@/components/chat/chat-panel').then(m => ({ default: m.ChatPanel })))
// Plan 4 T6 / decision #6: order-completion modal RETIRED — the order-success
// PAGE is the single completion surface (it mounted globally here and could
// pop over any route, competing with /thanh-toan-thanh-cong/:id).

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname, search])
  return null
}

export function MainLayout() {
  const [chatOpen, setChatOpen] = useState(false)
  const { isOpen: isCartOpen } = useCart()
  const { pathname } = useLocation()

  // Plan 3 T6: PDP có sticky buy bar fixed bottom trên mobile — chừa chỗ cho footer
  // để bar không che nội dung footer (per mobile-pdp screen). Chỉ áp dụng trên PDP.
  const isPdpRoute = /^\/san-pham\/.+/.test(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <div className={isPdpRoute ? 'pb-20 sm:pb-24 lg:pb-0' : undefined}>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <CartDrawer />
        <ChatLauncher isOpen={chatOpen} onToggle={() => setChatOpen(v => !v)} cartOpen={isCartOpen} />
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </Suspense>
    </div>
  )
}
