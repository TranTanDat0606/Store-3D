import { lazy, Suspense, useState } from 'react'
import { Play, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MiniGameModal = lazy(() =>
  import('@/components/mini-game/mini-game-modal').then((m) => ({
    default: m.MiniGameModal,
  }))
)

const GAMES = [
  {
    id: 'miu9-future-run',
    name: 'MIU-9 Future Run',
    description: 'Chạy bộ vô hạn, bắn hạ kẻ thù và nhận điểm!',
    image: '/game-thumbnail.svg',
    status: 'active' as const,
  },
]

export default function AdminMiniGamePage() {
  const [gameOpen, setGameOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mini Game</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý và kiểm thử mini game
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Card key={game.id} className="overflow-hidden">
            <div className="aspect-video overflow-hidden bg-muted">
              <img
                src={game.image}
                alt={game.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="space-y-3 p-4">
              <div>
                <h3 className="text-lg font-semibold">{game.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {game.description}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="size-3" />
                  Đang hoạt động
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setGameOpen(true)}
                  className="gap-1.5"
                >
                  <Play className="size-3.5" />
                  Test Play
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <MiniGameModal open={gameOpen} onOpenChange={setGameOpen} />
      </Suspense>
    </div>
  )
}
