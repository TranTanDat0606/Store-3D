import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib'

const LANE_COUNT = 5
const INITIAL_LIVES = 3
const SPAWN_INTERVAL_MS = 1200
const MIN_SPAWN_INTERVAL_MS = 400
const SPAWN_ACCELERATION = 0.97
const BASE_SPEED = 1.2
const MAX_SPEED = 4.0
const SPEED_ACCELERATION = 0.003

type ObjectType = 'mosquito' | 'fly' | 'dragonfly' | 'beetle' | 'rock' | 'fruit'

interface FallingObject {
  id: number
  type: ObjectType
  lane: number
  y: number
  speed: number
  points: number
  emoji: string
  dangerous: boolean
  caught?: boolean
}

interface FrogCatcherProps {
  onGameEnd: (score: number) => void
}

const OBJECT_CONFIG: Record<ObjectType, { emoji: string; points: number; dangerous: boolean }> = {
  mosquito: { emoji: '🦟', points: 2, dangerous: false },
  fly: { emoji: '🪰', points: 4, dangerous: false },
  dragonfly: { emoji: '🦋', points: 6, dangerous: false },
  beetle: { emoji: '🪲', points: 8, dangerous: false },
  rock: { emoji: '🪨', points: 0, dangerous: true },
  fruit: { emoji: '🍎', points: 0, dangerous: true },
}

const INSECT_TYPES: ObjectType[] = ['mosquito', 'fly', 'dragonfly', 'beetle']
const OBSTACLE_TYPES: ObjectType[] = ['rock', 'fruit']

let nextId = 0

function spawnObject(speed: number): FallingObject {
  const isInsect = Math.random() < 0.65
  const typePool = isInsect ? INSECT_TYPES : OBSTACLE_TYPES
  const type = typePool[Math.floor(Math.random() * typePool.length)]
  const config = OBJECT_CONFIG[type]

  return {
    id: nextId++,
    type,
    lane: Math.floor(Math.random() * LANE_COUNT),
    y: -10,
    speed: speed * (0.8 + Math.random() * 0.4),
    points: config.points,
    emoji: config.emoji,
    dangerous: config.dangerous,
  }
}

export function FrogCatcher({ onGameEnd }: FrogCatcherProps) {
  const [frogLane, setFrogLane] = useState(2)
  const [objects, setObjects] = useState<FallingObject[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [flashLane, setFlashLane] = useState<number | null>(null)
  const [combo, setCombo] = useState(0)

  const speedRef = useRef(BASE_SPEED)
  const spawnIntervalRef = useRef(SPAWN_INTERVAL_MS)
  const lastSpawnRef = useRef(0)
  const scoreRef = useRef(0)
  const livesRef = useRef(INITIAL_LIVES)
  const gameOverRef = useRef(false)
  const objectsRef = useRef<FallingObject[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClickObject = useCallback((obj: FallingObject) => {
    if (gameOverRef.current || obj.caught) return

    if (obj.dangerous) {
      const newLives = livesRef.current - 1
      livesRef.current = newLives
      setLives(newLives)
      setFlashLane(obj.lane)
      setTimeout(() => setFlashLane(null), 300)

      objectsRef.current = objectsRef.current.filter((o) => o.id !== obj.id)
      setObjects([...objectsRef.current])

      if (newLives <= 0) {
        gameOverRef.current = true
        setGameOver(true)
        onGameEnd(scoreRef.current)
      }
    } else {
      const pts = obj.points
      scoreRef.current += pts
      setScore(scoreRef.current)
      setCombo((c) => c + 1)

      objectsRef.current = objectsRef.current.map((o) =>
        o.id === obj.id ? { ...o, caught: true } : o
      )
      setObjects([...objectsRef.current])

      setTimeout(() => {
        objectsRef.current = objectsRef.current.filter((o) => o.id !== obj.id)
        setObjects([...objectsRef.current])
      }, 200)
    }
  }, [onGameEnd])

  const moveFrog = useCallback((direction: -1 | 1) => {
    setFrogLane((prev) => {
      const next = prev + direction
      return Math.max(0, Math.min(LANE_COUNT - 1, next))
    })
  }, [])

  useEffect(() => {
    if (!started || gameOver) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault()
        moveFrog(-1)
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault()
        moveFrog(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameOver, moveFrog])

  useEffect(() => {
    if (!started || gameOver) return

    let animFrame: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      if (gameOverRef.current) return

      const dt = Math.min((now - lastTime) / 16.67, 3)
      lastTime = now

      speedRef.current = Math.min(speedRef.current + SPEED_ACCELERATION * dt, MAX_SPEED)
      spawnIntervalRef.current = Math.max(
        spawnIntervalRef.current * SPAWN_ACCELERATION,
        MIN_SPAWN_INTERVAL_MS,
      )

      if (now - lastSpawnRef.current > spawnIntervalRef.current) {
        lastSpawnRef.current = now
        const newObj = spawnObject(speedRef.current)
        objectsRef.current = [...objectsRef.current, newObj]
        setObjects([...objectsRef.current])
      }

      const updated: FallingObject[] = []
      let hitObstacle = false

      for (const obj of objectsRef.current) {
        if (obj.caught) {
          updated.push(obj)
          continue
        }

        const newY = obj.y + obj.speed * dt
        if (newY >= 95) {
          if (obj.dangerous && obj.lane === frogLane) {
            hitObstacle = true
          }
          continue
        }

        if (obj.dangerous && !obj.caught) {
          const frogY = 85
          if (obj.lane === frogLane && newY >= frogY - 8 && newY <= frogY + 8) {
            hitObstacle = true
            continue
          }
        }

        updated.push({ ...obj, y: newY })
      }

      objectsRef.current = updated
      setObjects([...updated])

      if (hitObstacle) {
        const newLives = livesRef.current - 1
        livesRef.current = newLives
        setLives(newLives)
        setFlashLane(frogLane)
        setTimeout(() => setFlashLane(null), 300)

        if (newLives <= 0) {
          gameOverRef.current = true
          setGameOver(true)
          onGameEnd(scoreRef.current)
          return
        }
      }

      animFrame = requestAnimationFrame(loop)
    }

    animFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame)
  }, [started, gameOver, frogLane, onGameEnd])

  const handleStart = useCallback(() => {
    nextId = 0
    speedRef.current = BASE_SPEED
    spawnIntervalRef.current = SPAWN_INTERVAL_MS
    lastSpawnRef.current = 0
    scoreRef.current = 0
    livesRef.current = INITIAL_LIVES
    gameOverRef.current = false
    objectsRef.current = []

    setFrogLane(2)
    setObjects([])
    setScore(0)
    setLives(INITIAL_LIVES)
    setGameOver(false)
    setStarted(true)
    setCombo(0)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="flex items-center gap-1">
          {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                'size-5 transition-all',
                i < lives ? 'fill-red-500 text-red-500' : 'text-muted-foreground/30',
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{score}</span>
          {combo > 2 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              x{combo}
            </span>
          )}
        </div>
      </div>

      {!started && !gameOver && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><span className="text-lg">🦟</span><br />+2</div>
            <div><span className="text-lg">🪰</span><br />+4</div>
            <div><span className="text-lg">🦋</span><br />+6</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><span className="text-lg">🪲</span><br />+8</div>
            <div><span className="text-lg">🪨</span><br />-1 ❤️</div>
            <div><span className="text-lg">🍎</span><br />-1 ❤️</div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Nhấn vào côn trùng để bắt. Tránh đá và quả!
          </p>
        </div>
      )}

      {(started || gameOver) && (
        <div
          ref={containerRef}
          className={cn(
            'relative w-full max-w-sm overflow-hidden rounded-xl border bg-gradient-to-b from-sky-100 to-emerald-100 dark:from-sky-950 dark:to-emerald-950',
            flashLane !== null && 'animate-pulse ring-2 ring-red-500',
          )}
          style={{ height: 320 }}
        >
          {Array.from({ length: LANE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-r border-black/5 last:border-r-0"
              style={{ left: `${(i / LANE_COUNT) * 100}%`, width: `${100 / LANE_COUNT}%` }}
            />
          ))}

          {!gameOver && (
            <button
              type="button"
              className="absolute bottom-2 z-20 flex items-center justify-center transition-all duration-100"
              style={{
                left: `${(frogLane / LANE_COUNT) * 100 + 100 / LANE_COUNT / 2}%`,
                transform: 'translateX(-50%)',
              }}
              aria-label="Con ếch"
            >
              <span className="text-4xl drop-shadow-lg select-none">🐸</span>
            </button>
          )}

          {objects.map((obj) => {
            if (obj.caught) {
              return (
                <div
                  key={obj.id}
                  className="absolute z-10 flex items-center justify-center transition-all duration-200 scale-150 opacity-0"
                  style={{
                    left: `${(obj.lane / LANE_COUNT) * 100 + 100 / LANE_COUNT / 2}%`,
                    top: `${obj.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="text-2xl">{obj.emoji}</span>
                  <span className="absolute -top-4 text-xs font-bold text-emerald-600">+{obj.points}</span>
                </div>
              )
            }

            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => handleClickObject(obj)}
                className={cn(
                  'absolute z-10 flex items-center justify-center transition-transform active:scale-125',
                  obj.dangerous ? 'cursor-pointer' : 'cursor-pointer',
                )}
                style={{
                  left: `${(obj.lane / LANE_COUNT) * 100 + 100 / LANE_COUNT / 2}%`,
                  top: `${obj.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={obj.dangerous ? `Chướng ngại: ${obj.emoji}` : `Côn trùng: ${obj.emoji}`}
              >
                <span className={cn(
                  'text-2xl drop-shadow-sm select-none',
                  !obj.dangerous && 'hover:scale-125 transition-transform',
                )}>
                  {obj.emoji}
                </span>
              </button>
            )
          })}

          {gameOver && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center text-white">
                <p className="text-2xl font-bold">Trò chơi kết thúc!</p>
                <p className="mt-1 text-lg">Điểm: {score}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {started && !gameOver && (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => moveFrog(-1)}
            className="flex size-10 items-center justify-center rounded-full border bg-white shadow-sm active:scale-95 dark:bg-slate-800"
            aria-label="Di chuyển trái"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => moveFrog(1)}
            className="flex size-10 items-center justify-center rounded-full border bg-white shadow-sm active:scale-95 dark:bg-slate-800"
            aria-label="Di chuyển phải"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      )}

      {!started && !gameOver && (
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 active:scale-95"
        >
          Bắt đầu chơi
        </button>
      )}
    </div>
  )
}
