import axios from 'axios'
import type { ApiResponse } from '@/types'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
})

// Extract the Vietnamese error message from any error shape.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.message) return data.message
    if (error.message === 'Network Error') return 'Không thể kết nối tới máy chủ'
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Đã có lỗi xảy ra, vui lòng thử lại'
}

export default apiClient
