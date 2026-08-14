import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50">
      <div className="relative aspect-square overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto flex items-end justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}