import apiClient from './apiClient'
import type { ApiResponse, User } from '@/types'

export interface RegisterPayload {
  fullname: string
  email: string
  password: string
  phone?: string
  address?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data.data),

  login: (data: LoginPayload) =>
    apiClient.post<ApiResponse<User>>('/auth/login', data).then((r) => r.data.data),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout').then((r) => r.data.data),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  updateProfile: (data: Partial<Pick<User, 'fullname' | 'phone' | 'address' | 'avatar'>>) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data).then((r) => r.data.data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<ApiResponse<null>>('/auth/password', data).then((r) => r.data.data),
}
