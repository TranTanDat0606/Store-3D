import apiClient from './apiClient'
import type { ApiResponse } from '@/types'

/**
 * Public business info — mirrors the server's `PublicSettings` projection
 * (server/src/services/settingsService.ts). EVERY key is optional: the API
 * strips any key that is not configured (never null, never a placeholder),
 * so an unconfigured DB returns `{}` inside the envelope.
 */
export interface PublicSettings {
  hotline?: string
  supportHours?: string
  email?: string
  address?: string
  socialLinks?: {
    facebook?: string
    zalo?: string
    instagram?: string
  }
}

export const settingsApi = {
  // Envelope handled exactly like sibling services: { success, message, data } → data.
  getPublic: () =>
    apiClient
      .get<ApiResponse<PublicSettings>>('/settings/public')
      .then((r) => r.data.data ?? {}),
}
