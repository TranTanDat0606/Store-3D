import axios from 'axios'
import { toast } from 'sonner'
import { conflictToastMessage, getApiErrorInfo } from '@/lib/apiError'

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

if (!API_URL && !import.meta.env.DEV) {
  console.error('[Store3D] Missing VITE_API_URL env variable. API calls will fail in production.')
}

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
})

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    if (typeof data === 'string' || (data != null && typeof data !== 'object')) {
      return Promise.reject(new Error('Invalid API response format'))
    }
    return response
  },
  (error) => {
    // Cross-plan contract §4 (Plan 2 T7): 409 is the ONLY globally toasted
    // status — the stale-data/duplicate conflict surfaces here so every
    // mutation path gets it from this single point. 401 has no global toast
    // (the client has no 401 interceptor today — auth stays call-site driven;
    // no double-toast, behavior unchanged). 400/403/404/others are surfaced
    // by call sites via getErrorMessage/getApiErrorInfo — no global toast.
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      toast.error(conflictToastMessage())
    }
    return Promise.reject(error)
  },
)

// Extract the Vietnamese error message from any error shape.
// Back-compat shim (Plan 2 T7): reimplemented on top of getApiErrorInfo —
// identical string outcomes for existing callers on envelope messages and 400s.
export function getErrorMessage(error: unknown): string {
  return getApiErrorInfo(error).message
}

export default apiClient
