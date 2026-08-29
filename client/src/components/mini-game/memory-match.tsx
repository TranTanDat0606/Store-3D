import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { GameCard } from './game-card'
import { GameTimer } from './game-timer'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib'

const GAME_DURATION = 60
const MATCH_SCORE = 10
const TIME_BONUS_PER_SECOND = 2

const SYMBOLS = ['📦', '🎮', '⭐', '🎲', '🎯', '🏆']

interface CardData {
  id: number
  symbol: string
  pairIndex: number
}

interface MemoryMatchProps {
  onGameEnd: (score: number) => void
  disabled?: boolean
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MemoryMatch({ onGameEnd, disabled }: MemoryMatchProps) {
  const [cards] = useState<CardData[]>(() => initCards())
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set())
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const lockRef = useRef(false)
  const timeRef = useRef(GAME_DURATION)

  const totalPairs = useMemo(() => cards.length / 2, [cards])

  function initCards(): CardData[] {
    const selected = shuffle(SYMBOLS).slice(0, 3)
    const pairs = selected.flatMap((symbol, i) => [
      { id: i * 2, symbol, pairIndex: i },
      { id: i * 2 + 1, symbol, pairIndex: i },
    ])
    return shuffle(pairs)
  }

  useEffect(() => {
    if (showPreview) {
      const timer = setTimeout(() => setShowPreview(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showPreview])

  const handleTimeUp = useCallback(() => {
    if (gameOver) return
    setGameOver(true)
    const timeBonus = timeRef.current * TIME_BONUS_PER_SECOND
    onGameEnd(score + timeBonus)
  }, [gameOver, score, onGameEnd])

  const handleCardClick = useCallback(
    (id: number) => {
      if (lockRef.current || gameOver || disabled || showPreview) return

      if (!gameStarted) setGameStarted(true)

      const card = cards.find((c) => c.id === id)
      if (!card || matchedPairs.has(card.pairIndex) || flippedIds.includes(id)) return

      const newFlipped = [...flippedIds, id]
      setFlippedIds(newFlipped)

      if (newFlipped.length === 2) {
        lockRef.current = true
        const [first, second] = newFlipped
        const firstCard = cards.find((c) => c.id === first)!
        const secondCard = cards.find((c) => c.id === second)!

        if (firstCard.pairIndex === secondCard.pairIndex) {
          const newMatched = new Set(matchedPairs)
          newMatched.add(firstCard.pairIndex)
          setMatchedPairs(newMatched)
          setScore((s) => s + MATCH_SCORE)
          setFlippedIds([])
          lockRef.current = false

          if (newMatched.size === totalPairs) {
            setGameOver(true)
            const timeBonus = timeRef.current * TIME_BONUS_PER_SECOND
            onGameEnd(MATCH_SCORE * totalPairs + timeBonus)
          }
        } else {
          setTimeout(() => {
            setFlippedIds([])
            lockRef.current = false
          }, 800)
        }
      }
    },
    [cards, flippedIds, matchedPairs, gameOver, disabled, showPreview, gameStarted, totalPairs, onGameEnd],
  )

  const previewAll = showPreview && gameStarted === false

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <span className="font-mono text-lg font-bold">{score}</span>
        </div>
        <GameTimer duration={GAME_DURATION} onTimeUp={handleTimeUp} running={gameStarted && !gameOver} />
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {cards.map((card) => (
          <GameCard
            key={card.id}
            symbol={card.symbol}
            isFlipped={previewAll || flippedIds.includes(card.id)}
            isMatched={matchedPairs.has(card.pairIndex)}
            onClick={() => handleCardClick(card.id)}
            disabled={disabled || gameOver || matchedPairs.has(card.pairIndex)}
          />
        ))}
      </div>

      <div className="text-muted-foreground text-center text-xs">
        {gameOver
          ? `Trò chơi kết thúc! Điểm: ${score}`
          : showPreview
            ? 'Ghi nhớ vị trí các thẻ bài...'
            : `${matchedPairs.size}/${totalPairs} cặp đã tìm thấy`}
      </div>

      <div className="flex gap-1">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'size-2 rounded-full transition-colors',
              matchedPairs.has(i) ? 'bg-emerald-500' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  )
}
