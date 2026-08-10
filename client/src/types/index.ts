export type UserRole = 'admin' | 'customer'

export interface User {
  _id: string
  fullname: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  address?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ProductMaterial = 'PLA' | 'PETG' | 'ABS' | 'Resin'
export type PrinterType = 'FDM' | 'Resin Printer'
export type ProductStatus = 'active' | 'inactive' | 'out-of-stock'

export interface Category {
  _id: string
  name: string
  slug: string
  image: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  images: string[]
  category: string | { _id: string; name: string; slug: string; image?: string }
  material: ProductMaterial
  printerType: PrinterType
  size: string
  stock: number
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  status: ProductStatus
  featured: boolean
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank-transfer'
export type PaymentStatus = 'unpaid' | 'paid'

export interface OrderItem {
  _id: string
  order: string
  product: string | Product
  name: string
  image: string
  price: number
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface Order {
  _id: string
  user: string
  items: OrderItem[]
  customer: {
    name: string
    phone: string
    email: string
    address: string
  }
  note?: string
  subtotal: number
  discount: number
  shipping: number
  total: number
  coupon?: {
    code: string
    discount: number
  }
  payment: {
    method: PaymentMethod
    status: PaymentStatus
  }
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface Wishlist {
  _id: string
  user: string
  products: Product[]
  createdAt: string
  updatedAt: string
}

export interface Review {
  _id: string
  user: string | { _id: string; fullname: string; avatar?: string }
  product: string | { _id: string; name: string; slug: string }
  rating: number
  comment: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  _id: string
  code: string
  discount: number
  type: CouponType
  expiredDate: string
  quantity: number
  usedCount: number
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  pagination?: PaginationMeta
  errors?: unknown[]
}

export interface StatsOverview {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  pendingOrders: number
  completedOrders: number
}

export interface RevenuePoint {
  date: string
  revenue: number
  orders: number
}

export interface BestSellingProduct {
  _id: string
  name: string
  slug: string
  image: string
  totalSold: number
  revenue: number
}

export interface OrdersByStatus {
  status: OrderStatus
  count: number
}
