import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-lg font-semibold">Đã có lỗi xảy ra</p>
          <p className="text-muted-foreground text-sm">
            Không thể tải trang. Vui lòng thử lại.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tải lại trang
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
