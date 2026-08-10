import apiClient from './apiClient'
import type { ApiResponse, Category, PaginationMeta, Product, ProductMaterial, ProductStatus, PrinterType } from '@/types'

export interface ProductQuery {
  page?: number
  limit?: number
  sort?: string
  search?: string
  category?: string
  categorySlug?: string
  material?: string
  printerType?: string
  status?: string
  featured?: boolean | string
  minPrice?: number
  maxPrice?: number
}

export interface ProductListResult {
  data: Product[]
  pagination: PaginationMeta
}

export interface ProductPayload {
  name: string
  slug?: string
  description?: string
  images: string[]
  category: string
  material: ProductMaterial
  printerType: PrinterType
  size?: string
  stock: number
  originalPrice: number
  salePrice: number
  status?: ProductStatus
  featured?: boolean
}

export const productApi = {
  list: (params: ProductQuery = {}) =>
    apiClient.get<ApiResponse<Product[]>>('/products', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${slug}`).then((r) => r.data.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data.data),

  related: (id: string, limit = 4) =>
    apiClient.get<ApiResponse<Product[]>>(`/products/${id}/related`, { params: { limit } }).then((r) => r.data.data),

  featured: (params: ProductQuery = {}) =>
    apiClient.get<ApiResponse<Product[]>>('/products/featured', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  create: (data: ProductPayload) =>
    apiClient.post<ApiResponse<Product>>('/products', data).then((r) => r.data.data),

  update: (id: string, data: Partial<ProductPayload>) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/products/${id}`).then((r) => r.data.data),
}

export const categoryApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<Category[]>>('/categories', { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination!,
    })),

  all: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories/all').then((r) => r.data.data),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Category>>(`/categories/${slug}`).then((r) => r.data.data),

  create: (data: { name: string; image: string; description?: string }) =>
    apiClient.post<ApiResponse<Category>>('/categories', data).then((r) => r.data.data),

  update: (id: string, data: Partial<{ name: string; image: string; description?: string }>) =>
    apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/categories/${id}`).then((r) => r.data.data),
}
