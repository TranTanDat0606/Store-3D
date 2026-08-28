import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/10 mb-6 flex size-20 items-center justify-center rounded-2xl">
        <SearchX className="text-primary size-10" />
      </div>

      <h1 className="mb-2 text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
        404
      </h1>

      <h2 className="mb-3 text-xl font-semibold text-slate-700 dark:text-slate-200">
        Không tìm thấy trang
      </h2>

      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
      </p>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2 size-4" />
            Về trang chủ
          </Link>
        </Button>
        <Button asChild>
          <Link to="/san-pham">
            <SearchX className="mr-2 size-4" />
            Xem sản phẩm
          </Link>
        </Button>
      </div>
    </div>
  )
}
