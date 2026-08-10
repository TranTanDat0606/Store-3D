import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
      >
        <Home className="size-3.5" />
        <span className="sr-only">Trang chủ</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="inline-flex items-center gap-1.5">
            <ChevronRight className="text-muted-foreground/50 size-3.5" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'max-w-[200px] truncate',
                  isLast ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
