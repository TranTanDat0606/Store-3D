import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { MainLayout } from '@/layouts/main-layout'
import { AccountLayout } from '@/layouts/account-layout'
import { AdminLayout } from '@/layouts/admin-layout'
import { ProtectedRoute, GuestOnlyRoute, AdminRoute } from '@/routes/guards'
import { ChunkErrorBoundary } from '@/routes/chunk-error-boundary'

const HomePage = lazy(() => import('@/pages/home-page'))
const ProductListPage = lazy(() => import('@/pages/product-list-page'))
const ProductDetailPage = lazy(() => import('@/pages/product-detail-page'))
const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const RegisterPage = lazy(() => import('@/pages/auth/register-page'))
const CheckoutPage = lazy(() => import('@/pages/checkout-page'))
const OrderSuccessPage = lazy(() => import('@/pages/order-success-page'))
const QrPaymentPage = lazy(() => import('@/pages/qr-payment-page'))
const AccountDashboardPage = lazy(() => import('@/pages/account/dashboard-page'))
const OrdersPage = lazy(() => import('@/pages/account/orders-page'))
const OrderDetailPage = lazy(() => import('@/pages/account/order-detail-page'))
const WishlistPage = lazy(() => import('@/pages/account/wishlist-page'))
const ProfilePage = lazy(() => import('@/pages/account/profile-page'))
const ChangePasswordPage = lazy(() => import('@/pages/account/change-password-page'))
const CouponsPage = lazy(() => import('@/pages/account/coupons-page'))
const ReviewFormPage = lazy(() => import('@/pages/review-form-page'))
const ContactPage = lazy(() => import('@/pages/contact-page'))
const NewsPage = lazy(() => import('@/pages/news-page'))
const NewsDetailPage = lazy(() => import('@/pages/news-detail-page'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard-page'))
const AdminProductsPage = lazy(() => import('@/pages/admin/products-page'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories-page'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/orders-page'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/coupons-page'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/reviews-page'))
const AdminUsersPage = lazy(() => import('@/pages/admin/users-page'))
const AdminProductEditPage = lazy(() => import('@/pages/admin/product-edit-page'))
const AdminNewsPage = lazy(() => import('@/pages/admin/news-page'))
const AdminSupportPage = lazy(() => import('@/pages/admin/support-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-primary/10 text-primary flex size-12 animate-pulse items-center justify-center rounded-xl">
        <span className="text-lg font-bold">3D</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ChunkErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="san-pham" element={<ProductListPage />} />
                <Route path="san-pham/:slug" element={<ProductDetailPage />} />
                <Route path="lien-he" element={<ContactPage />} />
                <Route path="tin-tuc" element={<NewsPage />} />
                <Route path="tin-tuc/:slug" element={<NewsDetailPage />} />

                <Route element={<GuestOnlyRoute />}>
                  <Route path="dang-nhap" element={<LoginPage />} />
                  <Route path="dang-ky" element={<RegisterPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route path="thanh-toan" element={<CheckoutPage />} />
                  <Route path="thanh-toan-thanh-cong/:id" element={<OrderSuccessPage />} />
                  <Route path="thanh-toan-qr/:id" element={<QrPaymentPage />} />
                  <Route path="danh-gia/:slug" element={<ReviewFormPage />} />
                  <Route path="tai-khoan" element={<AccountLayout />}>
                    <Route index element={<AccountDashboardPage />} />
                    <Route path="don-hang" element={<OrdersPage />} />
                    <Route path="don-hang/:id" element={<OrderDetailPage />} />
                    <Route path="yeu-thich" element={<WishlistPage />} />
                    <Route path="ho-so" element={<ProfilePage />} />
                    <Route path="mat-khau" element={<ChangePasswordPage />} />
                    <Route path="ma-giam-gia" element={<CouponsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="/admin" element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="san-pham" element={<AdminProductsPage />} />
                  <Route path="san-pham/:id" element={<AdminProductEditPage />} />
                  <Route path="danh-muc" element={<AdminCategoriesPage />} />
                  <Route path="don-hang" element={<AdminOrdersPage />} />
                  <Route path="ma-giam-gia" element={<AdminCouponsPage />} />
                  <Route path="danh-gia" element={<AdminReviewsPage />} />
                  <Route path="khach-hang" element={<AdminUsersPage />} />
                  <Route path="bai-viet" element={<AdminNewsPage />} />
                  <Route path="ho-tro" element={<AdminSupportPage />} />
                </Route>
              </Route>
            </Routes>
            </Suspense>
          </ChunkErrorBoundary>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
