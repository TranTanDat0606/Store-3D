import axios from 'axios'
import type { ApiResponse } from '@/types'

/**
 * API error-status mapping layer (Plan 2 Task 7 — Cross-plan contract §4).
 *
 * The server's central error handler (`server/src/middleware/errorHandler.ts`
 * via `errorResponse`) always answers `{ success: false, message, data: null,
 * errors: [] }` with the HTTP status carrying the meaning. This module maps
 * that reality to a `kind` + display `message`. Server messages always take
 * precedence; the friendly Vietnamese strings below are FALLBACKS for the
 * rare case a response arrives without a usable message.
 */
export type ApiErrorKind = 'validation' | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'unknown'

export interface ApiErrorInfo {
  status?: number
  message: string
  kind: ApiErrorKind
}

/**
 * Cross-plan contract §4 verbatim (docs/superpowers/plans/
 * 2026-10-17-backend-trust-track.md, "Cross-plan contract" item 4):
 * 409 → "Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại".
 */
export function conflictToastMessage(): string {
  return 'Dữ liệu đã thay đổi bởi người khác, vui lòng tải lại'
}

// Friendly VN fallbacks — used ONLY when the server message is missing/empty.
const FALLBACK_NOT_FOUND = 'Không tìm thấy dữ liệu'
const FALLBACK_FORBIDDEN = 'Bạn không có quyền thực hiện thao tác này'
const FALLBACK_NETWORK = 'Không thể kết nối tới máy chủ' // byte-identical to the legacy copy
const FALLBACK_GENERIC = 'Đã có lỗi xảy ra, vui lòng thử lại'

function kindForStatus(status: number | undefined): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation'
    case 403:
      return 'forbidden'
    case 404:
      return 'not-found'
    case 409:
      return 'conflict'
    default:
      // 401 is deliberately NOT a distinct kind (plan-pinned union): it is left
      // to the existing auth flow. `status` is preserved so auth code can check
      // `info.status === 401`. No global toast for 401.
      return 'unknown'
  }
}

/**
 * Normalize any thrown value into `{ status?, message, kind }`.
 * - Axios error with a response: `status` from `err.response.status`, message
 *   from the envelope's `message` when present, else the per-kind fallback.
 * - Axios error without a response (network down, DNS, timeout): kind `network`.
 * - Anything else: kind `unknown` with its own `.message` (legacy behavior).
 */
export function getApiErrorInfo(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return { status: undefined, message: FALLBACK_NETWORK, kind: 'network' }
    }
    const status = err.response.status
    const kind = kindForStatus(status)
    const envelope = err.response.data as ApiResponse<unknown> | undefined
    const serverMessage = typeof envelope?.message === 'string' ? envelope.message.trim() : ''
    if (serverMessage) return { status, message: serverMessage, kind }
    switch (kind) {
      case 'not-found':
        return { status, message: FALLBACK_NOT_FOUND, kind }
      case 'forbidden':
        return { status, message: FALLBACK_FORBIDDEN, kind }
      case 'conflict':
        return { status, message: conflictToastMessage(), kind }
      default:
        // validation (400) / 401 / 5xx without a message: keep the legacy
        // getErrorMessage outcome (axios' own `error.message`).
        return { status, message: err.message || FALLBACK_GENERIC, kind }
    }
  }
  if (err instanceof Error) return { message: err.message, kind: 'unknown' }
  return { message: FALLBACK_GENERIC, kind: 'unknown' }
}
