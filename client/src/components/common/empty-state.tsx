import { Box } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có gì ở đây. Vui lòng quay lại sau.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        {icon ?? <Box className="size-7" />}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
