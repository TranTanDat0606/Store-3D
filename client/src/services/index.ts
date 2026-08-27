import apiClient from './apiClient'
export { productApi, categoryApi } from './productApi'
export type { ProductPayload, ProductQuery, ProductListResult } from './productApi'
import type { ApiResponse, Coupon, CouponWithAvailability, Order, OrderStatus, PaginationMeta, PaymentMethod, Wishlist, Review, ReviewEligibility, User, StatsOverview, RevenuePoint, RevenuePeriod, RevenuePeriodResult, BestSellingProduct, OrdersByStatus, News, ContactRequest } from '@/types'

export interface OrderItemInput {
  product: string
  quantity: number
}

export interface CreateOrderPayload {
  customer: {
    name: string
    phone: string
    email: string
    address: string
  }
  items: OrderItemInput[]
  note?: string
  paymentMethod?: PaymentMethod
  couponCode?: string
}

export interface ListResult<T> {
  data: T[]
  pagination: PaginationMeta
}

export const orderApi = {
  create: (data: CreateOrderPayload) =>
    apiClient.post<ApiResponse<Order>>('/orders', data).then((r) => r.data.data),

  mine: (params: { page?: number; limit?: number; status?: string } = {}) =>
    apiClient.get<ApiResponse<Order[]>>('/orders/mine', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`).then((r) => r.data.data),

  adminList: (params: { page?: number; limit?: number; search?: string; status?: string; from?: string; to?: string } = {}) =>
    apiClient.get<ApiResponse<Order[]>>('/orders/admin', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  adminUpdateStatus: (id: string, data: { status: OrderStatus; paymentStatus?: 'unpaid' | 'paid' }) =>
    apiClient.put<ApiResponse<Order>>(`/orders/admin/${id}/status`, data).then((r) => r.data.data),

  cancelByUser: (id: string, reason?: string) =>
    apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason }).then((r) => r.data.data),
}

export const wishlistApi = {
  get: () =>
    apiClient.get<ApiResponse<Wishlist>>('/wishlist').then((r) => r.data.data),

  add: (productId: string) =>
    apiClient.post<ApiResponse<Wishlist>>('/wishlist', { productId }).then((r) => r.data.data),

  remove: (productId: string) =>
    apiClient.delete<ApiResponse<Wishlist>>(`/wishlist/${productId}`).then((r) => r.data.data),

  moveToCart: (productId: string) =>
    apiClient.post<ApiResponse<{ product: unknown; wishlist: Wishlist }>>('/wishlist/move-to-cart', { productId }).then((r) => r.data.data),
}

export const couponApi = {
  list: () =>
    apiClient.get<ApiResponse<Coupon[]>>('/coupons').then((r) => r.data.data),

  create: (data: Partial<Coupon>) =>
    apiClient.post<ApiResponse<Coupon>>('/coupons', data).then((r) => r.data.data),

  update: (id: string, data: Partial<Coupon>) =>
    apiClient.put<ApiResponse<Coupon>>(`/coupons/${id}`, data).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/coupons/${id}`).then((r) => r.data.data),

  apply: (code: string, subtotal: number) =>
    apiClient.post<ApiResponse<{ coupon: Coupon; discount: number }>>('/coupons/apply', { code, subtotal }).then((r) => r.data.data),

  available: (subtotal: number) =>
    apiClient.get<ApiResponse<CouponWithAvailability[]>>('/coupons/available', { params: { subtotal } }).then((r) => r.data.data),
}

export const reviewApi = {
  listByProduct: (productId: string, params: { page?: number; limit?: number } = {}) =>
    apiClient.get<ApiResponse<Review[]>>(`/reviews/product/${productId}`, { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  me: (productId: string) =>
    apiClient.get<ApiResponse<ReviewEligibility>>(`/reviews/me/${productId}`).then((r) => r.data.data),

  create: (data: { product: string; rating: number; comment?: string; images?: string[] }) =>
    apiClient.post<ApiResponse<Review>>('/reviews', data).then((r) => r.data.data),

  update: (id: string, data: { rating?: number; comment?: string; images?: string[] }) =>
    apiClient.put<ApiResponse<Review>>(`/reviews/${id}`, data).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/reviews/${id}`).then((r) => r.data.data),

  adminList: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<Review[]>>('/reviews/admin', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  adminRemove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/reviews/admin/${id}`).then((r) => r.data.data),
}

export interface UserListResult extends ListResult<User> {
  meta?: { adminCount?: number }
}

export const userApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}): Promise<UserListResult> =>
    apiClient.get<ApiResponse<User[]>>('/users', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
      meta: r.data.meta,
    })),

  updateRole: (id: string, role: User['role']) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}/role`, { role }).then((r) => r.data.data),

  toggleActive: (id: string) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}/active`).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/users/${id}`).then((r) => r.data.data),
}

export const statsApi = {
  overview: () =>
    apiClient.get<ApiResponse<StatsOverview>>('/admin/stats/overview').then((r) => r.data.data),

  revenue: (days = 30) =>
    apiClient.get<ApiResponse<RevenuePoint[]>>('/admin/stats/revenue', { params: { days } }).then((r) => r.data.data),

  revenuePeriod: (period: RevenuePeriod) =>
    apiClient.get<ApiResponse<RevenuePeriodResult>>('/admin/stats/revenue-period', { params: { period } }).then((r) => r.data.data),

  bestSelling: (limit = 5) =>
    apiClient.get<ApiResponse<BestSellingProduct[]>>('/admin/stats/best-selling', { params: { limit } }).then((r) => r.data.data),

  ordersByStatus: () =>
    apiClient.get<ApiResponse<OrdersByStatus[]>>('/admin/stats/orders-by-status').then((r) => r.data.data),
}

export const uploadApi = {
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post<ApiResponse<{ url: string }>>('/upload', form).then((r) => r.data.data.url)
  },
}

export interface QrPaymentInfo {
  bank: { bin: string; accountNumber: string; accountName: string; accountDisplayName?: string; bankName: string }
  qrUrl: string
  orderCode: string
  amount: number
  expiresAt: string
}

export const paymentApi = {
  generateQr: (orderId: string) =>
    apiClient.post<ApiResponse<QrPaymentInfo>>(`/orders/${orderId}/payment-qr`).then((r) => r.data.data),

  simulateWebhook: (orderCode: string, amount: number) =>
    apiClient.post<ApiResponse<{ status: string }>>('/payment/webhook/simulate', { orderCode, amount }).then((r) => r.data.data),
}

export const contactApi = {
  submit: (data: { fullname: string; email: string; phone: string; message: string; subject?: string }) =>
    apiClient.post<ApiResponse<{ success: boolean; message: string; id?: string }>>('/contact', data).then((r) => r.data.data),

  adminList: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) =>
    apiClient.get<ApiResponse<ContactRequest[]>>('/contact/admin', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  adminGetById: (id: string) =>
    apiClient.get<ApiResponse<ContactRequest>>(`/contact/admin/${id}`).then((r) => r.data.data),

  adminUpdateStatus: (id: string, status: string, adminNote?: string) =>
    apiClient.put<ApiResponse<ContactRequest>>(`/contact/admin/${id}/status`, { status, adminNote }).then((r) => r.data.data),

  adminAddNote: (id: string, adminNote: string) =>
    apiClient.put<ApiResponse<ContactRequest>>(`/contact/admin/${id}/note`, { adminNote }).then((r) => r.data.data),

  adminCountNew: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/contact/admin/new-count').then((r) => r.data.data.count),
}

export const newsApi = {
  list: (params: { page?: number; limit?: number; category?: string } = {}) =>
    apiClient.get<ApiResponse<News[]>>('/news', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<News>>(`/news/${slug}`).then((r) => r.data.data),

  categories: () =>
    apiClient.get<ApiResponse<string[]>>('/news/categories').then((r) => r.data.data),

  adminList: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) =>
    apiClient.get<ApiResponse<News[]>>('/news/admin/all', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  adminGetById: (id: string) =>
    apiClient.get<ApiResponse<News>>(`/news/admin/${id}`).then((r) => r.data.data),

  adminCreate: (data: Partial<News>) =>
    apiClient.post<ApiResponse<News>>('/news/admin', data).then((r) => r.data.data),

  adminUpdate: (id: string, data: Partial<News>) =>
    apiClient.put<ApiResponse<News>>(`/news/admin/${id}`, data).then((r) => r.data.data),

  adminRemove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/news/admin/${id}`).then((r) => r.data.data),
}
