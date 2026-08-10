import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { PaginationMeta } from '@/types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

function getPageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage } = meta

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Phân trang"
      className="flex items-center justify-center gap-1 py-6"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={!hasPrevPage}
        aria-label="Trang đầu"
      >
        <ChevronsLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        aria-label="Trang trước"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {getPageItems(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`e-${index}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'default' : 'outline'}
            size="icon"
            className="text-sm"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        aria-label="Trang sau"
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={!hasNextPage}
        aria-label="Trang cuối"
      >
        <ChevronsRight className="size-4" />
      </Button>
    </nav>
  )
}
