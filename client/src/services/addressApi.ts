import apiClient from './apiClient'
import type { Address, CreateAddressPayload } from '@/types'
import type { ApiResponse } from '@/types'

export const addressApi = {
  list: () =>
    apiClient.get<ApiResponse<Address[]>>('/addresses').then((r) => r.data.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Address>>(`/addresses/${id}`).then((r) => r.data.data),

  create: (payload: CreateAddressPayload) =>
    apiClient.post<ApiResponse<Address>>('/addresses', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<CreateAddressPayload>) =>
    apiClient.put<ApiResponse<Address>>(`/addresses/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) =>
    apiClient.delete(`/addresses/${id}`),

  setDefault: (id: string) =>
    apiClient.patch<ApiResponse<Address>>(`/addresses/${id}/default`).then((r) => r.data.data),
}
