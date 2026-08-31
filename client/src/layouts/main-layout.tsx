import { lazy, Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/CartContext'

const CartDrawer = lazy(() => import('@/components/cart/cart-drawer').then(m => ({ default: m.CartDrawer })))
const ChatLauncher = lazy(() => import('@/components/chat/chat-launcher').then(m => ({ default: m.ChatLauncher })))
const ChatPanel = lazy(() => import('@/components/chat/chat-panel').then(m => ({ default: m.ChatPanel })))
const OrderCompletionModal = lazy(() => import('@/components/order-completion-modal').then(m => ({ default: m.OrderCompletionModal })))

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

  useEffect(() => {
    if (isCartOpen && chatOpen) setChatOpen(false)
  }, [isCartOpen, chatOpen])

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <CartDrawer />
        <ChatLauncher isOpen={chatOpen} onToggle={() => setChatOpen(v => !v)} />
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        <OrderCompletionModal />
      </Suspense>
    </div>
  )
}
