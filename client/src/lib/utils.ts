import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_URL } from '@/services/apiClient'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(src?: string | null): string {
  if (!src) return ''
  if (src.startsWith('data:')) return src
  if (src.includes('images.unsplash.com')) {
    const hasParams = src.includes('?')
    const sep = hasParams ? '&' : '?'
    return `${src}${sep}q=80&fm=webp`
  }
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) {
    const origin = API_URL.replace(/\/api\/?$/, '')
    if (!origin) return src
    return `${origin}${src}`
  }
  return src
}
