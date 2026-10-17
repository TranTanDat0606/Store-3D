import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib'
import { MobileControls } from './mobile-controls'
import { PixiRenderer } from './pixi-renderer'
import {
  createInitialState,
  updateGameState,
  loadBest,
  CANVAS_W,
  CANVAS_H,
  MAX_LIVES,
  type GameState,
} from './game-state'

type GamePhase = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover'

interface Miu9FutureRunProps {
  onGameEnd: (score: number) => void
}

export function Miu9FutureRun({ onGameEnd }: Miu9FutureRunProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const gsRef = useRef<GameState>(createInitialState())
  const rendererRef = useRef<PixiRenderer | null>(null)
  const initDoneRef = useRef(false)

  const [phase, setPhase] = useState<GamePhase>('loading')
  const [displayScore, setDisplayScore] = useState(0)
  const [displayBest, setDisplayBest] = useState(0)
  const [displayLives, setDisplayLives] = useState(MAX_LIVES)
  const [isMobile, setIsMobile] = useState(false)

  const onGameEndRef = useRef(onGameEnd)
  onGameEndRef.current = onGameEnd

  const jumpQueuedRef = useRef(false)
  const duckingRef = useRef(false)
  const shootRequestedRef = useRef(false)

  // ── Mobile detection ────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── PixiJS init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true

    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.className = 'block w-full h-full'
    container.appendChild(canvas)

    const renderer = new PixiRenderer()
    rendererRef.current = renderer

    let cancelled = false

    async function boot() {
      await renderer.init(canvas)
      if (cancelled) return

      const rect = container!.getBoundingClientRect()
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      renderer.resize(CANVAS_W, CANVAS_H)

      setPhase('menu')
    }

    boot().catch(() => {
      if (!cancelled) setPhase('menu')
    })

    return () => {
      cancelled = true
      renderer.destroy()
      if (container.contains(canvas)) container.removeChild(canvas)
      rendererRef.current = null
      initDoneRef.current = false
    }
  }, [])

  // ── Resize handling ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    const canvas = container?.querySelector('canvas')
    if (!container || !canvas) return

    function resize() {
      const rect = container!.getBoundingClientRect()
      canvas!.style.width = rect.width + 'px'
      canvas!.style.height = rect.height + 'px'
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [phase])

  // ── Keyboard input ──────────────────────────────────────────────────
  useEffect(() => {
    const keys: Record<string, boolean> = {}

    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase()

      // ESC → pause toggle
      if (k === 'escape') {
        if (phase === 'playing') {
          setPhase('paused')
        } else if (phase === 'paused') {
          setPhase('playing')
        }
        return
      }

      if (phase !== 'playing') return

      if (k === 'w' || k === ' ' || k === 'arrowup') {
        if (!keys[k]) { keys[k] = true; jumpQueuedRef.current = true }
        e.preventDefault()
      }
      if (k === 's' || k === 'arrowdown') { keys[k] = true; duckingRef.current = true; e.preventDefault() }
      if (k === 'f') { shootRequestedRef.current = true; e.preventDefault() }
    }

    function onKeyUp(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      keys[k] = false
      if (k === 's' || k === 'arrowdown') duckingRef.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [phase])

  // ── Window blur → pause ─────────────────────────────────────────────
  useEffect(() => {
    function onBlur() {
      if (phase === 'playing') setPhase('paused')
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [phase])

  // ── Canvas click → shoot ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function onClick() {
      if (phase === 'playing') shootRequestedRef.current = true
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [phase])

  // ── Mobile action handler ───────────────────────────────────────────
  const handleMobileAction = useCallback((action: string) => {
    if (phase !== 'playing') return
    switch (action) {
      case 'jump':
        jumpQueuedRef.current = true
        break
      case 'crouch':
        duckingRef.current = true
        break
      case 'crouch_up':
        duckingRef.current = false
        break
      case 'shoot':
        shootRequestedRef.current = true
        break
    }
  }, [phase])

  // ── Start game ──────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const gs = createInitialState()
    gs.bestScore = loadBest()
    gs.phase = 'playing'
    gsRef.current = gs
    setPhase('playing')
    setDisplayScore(0)
    setDisplayBest(gs.bestScore)
    setDisplayLives(MAX_LIVES)
    jumpQueuedRef.current = false
    duckingRef.current = false
    shootRequestedRef.current = false
  }, [])

  // ── Resume game ─────────────────────────────────────────────────────
  const resumeGame = useCallback(() => {
    setPhase('playing')
  }, [])

  // ── Go to menu ──────────────────────────────────────────────────────
  const goToMenu = useCallback(() => {
    setPhase('menu')
  }, [])

  // ── Game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    let lastTime = 0

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop)
      if (lastTime === 0) { lastTime = now; return }
      const rawDt = (now - lastTime) / 1000
      const dt = Math.min(rawDt, 0.05)
      lastTime = now

      const gs = gsRef.current
      if (gs.phase !== 'playing') return

      const renderer = rendererRef.current
      if (!renderer) return

      const jumpQueued = jumpQueuedRef.current
      const ducking = duckingRef.current
      const shootRequested = shootRequestedRef.current

      // Reset one-shot inputs after reading
      jumpQueuedRef.current = false
      shootRequestedRef.current = false

      const input = { jumpQueued, ducking, shootRequested }
      const result = updateGameState(gs, dt, input)

      renderer.update(gs, dt)

      setDisplayScore(gs.score)
      setDisplayLives(gs.lives)
      if (gs.bestScore > displayBest) setDisplayBest(gs.bestScore)

      if (result === 'gameover') {
        setPhase('gameover')
        onGameEndRef.current(gs.score)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col items-center gap-2 bg-background">
      {/* HUD — only when playing or paused */}
      {(phase === 'playing' || phase === 'paused') && (
        <div className="flex w-full items-center justify-between px-1">
          <div className="rounded-xl border border-accent/25 bg-background/50 px-4 py-2 backdrop-blur-md">
            <span className="font-mono text-xs uppercase tracking-wider text-accent/70">Score</span>
            <span className="ml-2 font-mono text-lg font-bold tabular-nums text-foreground drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">{String(displayScore).padStart(6, '0')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-accent/20 bg-background/50 px-3 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent/50">Best</span>
              <span className="ml-1.5 font-mono text-sm font-bold tabular-nums text-accent/80">{String(displayBest).padStart(6, '0')}</span>
            </div>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'text-xl transition-all duration-200',
                  i < displayLives ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]' : 'opacity-25 grayscale',
                )}
              >
                {i < displayLives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border-2 border-accent/20',
          'bg-background shadow-[0_0_40px_rgba(34,211,238,0.08)]',
          phase === 'playing' && 'cursor-crosshair',
          phase === 'gameover' && gsRef.current.shakeTimer > 0 && 'ring-2 ring-destructive/50',
        )}
        style={{ maxWidth: 1280, maxHeight: '70vh', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          LOADING OVERLAY
          ═══════════════════════════════════════════════════════════════ */}
      {phase === 'loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-background via-secondary to-background">
          <h2 className="mb-4 text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-destructive to-accent" style={{ fontFamily: 'Orbitron, monospace' }}>
            MIU-9 SYSTEM INITIALIZING...
          </h2>
          <div className="w-48 h-1 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-destructive to-accent rounded-full animate-pulse" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">LOADING ASSETS...</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          START OVERLAY — MIU-9 Cyberpunk Onboarding
          ═══════════════════════════════════════════════════════════════ */}
      {phase === 'menu' && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto backdrop-blur-sm"
          style={{
            backgroundImage: 'url(/game-thumbnail.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/85" />
          {/* Decorative grid lines */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Corner accents */}
          <div className="pointer-events-none absolute top-4 left-4 hidden h-12 w-12 border-t-2 border-l-2 border-accent/30 rounded-tl-lg sm:block" />
          <div className="pointer-events-none absolute top-4 right-4 hidden h-12 w-12 border-t-2 border-r-2 border-destructive/30 rounded-tr-lg sm:block" />
          <div className="pointer-events-none absolute bottom-4 left-4 hidden h-12 w-12 border-b-2 border-l-2 border-accent/30 rounded-bl-lg sm:block" />
          <div className="pointer-events-none absolute bottom-4 right-4 hidden h-12 w-12 border-b-2 border-r-2 border-destructive/30 rounded-br-lg sm:block" />

          {/* Header */}
          <div className="relative mb-1 flex items-center gap-2">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-accent/60 sm:w-8" />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent/70 sm:text-[10px] sm:tracking-[0.4em]">MiU-9 System Ready</span>
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-accent/60 sm:w-8" />
          </div>

          <h2 className="relative mb-0.5 text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-destructive via-foreground to-accent drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] sm:text-3xl">
            MIU-9 FUTURE RUN
          </h2>
          <p className="relative mb-3 text-[10px] tracking-widest text-foreground/30 uppercase sm:mb-4 sm:text-xs">Cyber Cat // Endless Runner</p>

          {/* Enemy Preview */}
          <div className="relative mb-4 hidden items-center justify-center rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/5 via-transparent to-destructive/5 px-6 py-3 sm:flex sm:mb-5">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl">🐱</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-destructive/60">Runner</span>
              </div>
              <div className="h-8 w-px bg-foreground/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl">🤖</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-warning/60">Robot</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🦅</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-accent/60">Bird</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">🐭</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-destructive/60">Mouse</span>
              </div>
            </div>
          </div>

          {/* Control Cards */}
          <div className="relative mb-3 flex gap-2 sm:mb-4 sm:gap-3">
            <div className="group flex flex-col items-center gap-0.5 rounded-xl border border-accent/20 bg-gradient-to-b from-accent/10 to-accent/5 px-3 py-2 backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] sm:gap-1 sm:px-5 sm:py-3">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-accent/30 bg-accent/10 px-1 font-mono text-xs font-bold text-accent sm:h-7 sm:min-w-[28px] sm:px-1.5 sm:text-sm">W</kbd>
                <span className="text-[8px] text-foreground/30 sm:text-[9px]">/</span>
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-accent/30 bg-accent/10 px-1 font-mono text-xs font-bold text-accent sm:h-7 sm:min-w-[28px] sm:px-1.5 sm:text-sm">⎵</kbd>
              </div>
              <span className="text-sm leading-none sm:text-lg">↑</span>
              <span className="text-[10px] font-semibold text-accent/80 sm:text-[11px]">Nhảy</span>
              <span className="hidden text-[9px] text-foreground/30 sm:block">Jump</span>
            </div>

            <div className="group flex flex-col items-center gap-0.5 rounded-xl border border-destructive/20 bg-gradient-to-b from-destructive/10 to-destructive/5 px-3 py-2 backdrop-blur-sm transition-all hover:border-destructive/40 hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] sm:gap-1 sm:px-5 sm:py-3">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-1 font-mono text-xs font-bold text-destructive sm:h-7 sm:min-w-[28px] sm:px-1.5 sm:text-sm">S</kbd>
              </div>
              <span className="text-sm leading-none sm:text-lg">↓</span>
              <span className="text-[10px] font-semibold text-destructive/80 sm:text-[11px]">Ngồi</span>
              <span className="hidden text-[9px] text-foreground/30 sm:block">Duck</span>
            </div>

            <div className="group flex flex-col items-center gap-0.5 rounded-xl border border-warning/20 bg-gradient-to-b from-warning/10 to-warning/5 px-3 py-2 backdrop-blur-sm transition-all hover:border-warning/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] sm:gap-1 sm:px-5 sm:py-3">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-warning/30 bg-warning/10 px-1 font-mono text-xs font-bold text-warning sm:h-7 sm:min-w-[28px] sm:px-1.5 sm:text-sm">F</kbd>
              </div>
              <span className="text-sm leading-none sm:text-lg">✦</span>
              <span className="text-[10px] font-semibold text-warning/80 sm:text-[11px]">Bắn</span>
              <span className="hidden text-[9px] text-foreground/30 sm:block">Fire</span>
            </div>
          </div>

          {/* Scoring Guide */}
          <div className="relative mb-4 flex items-stretch gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-3 py-2 backdrop-blur-sm sm:mb-5 sm:gap-4 sm:px-5 sm:py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg">⚔</span>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/50 sm:text-[10px]">Kill Score</div>
                <div className="text-[9px] text-foreground/35 sm:text-[11px]">Bắn hạ kẻ thù để nhận điểm</div>
              </div>
            </div>
            <div className="w-px bg-foreground/10" />
            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-1 text-[10px] sm:gap-1.5 sm:text-[11px]">
                <span className="text-accent">●</span>
                <span className="text-foreground/50">Bird</span>
                <span className="font-mono font-bold text-accent">+4</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:gap-1.5 sm:text-[11px]">
                <span className="text-warning">●</span>
                <span className="text-foreground/50">Robot</span>
                <span className="font-mono font-bold text-warning">+2</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:gap-1.5 sm:text-[11px]">
                <span className="text-destructive">●</span>
                <span className="text-foreground/50">Mouse</span>
                <span className="font-mono font-bold text-destructive">+2</span>
              </div>
            </div>
            <div className="w-px bg-foreground/10" />
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg">❤️</span>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/50 sm:text-[10px]">Lives</div>
                <div className="text-[9px] text-foreground/35 sm:text-[11px]">3 mạng • Tránh đạn & va chạm</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={startGame}
            className="relative rounded-xl bg-gradient-to-r from-destructive to-accent px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-12 sm:py-3.5 sm:text-sm"
          >
            Bắt đầu chơi
          </button>

          <p className="relative mt-2 hidden text-[10px] text-foreground/20 tracking-wider sm:mt-3">
            Press <kbd className="mx-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">W</kbd> <kbd className="mx-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">S</kbd> <kbd className="mx-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">F</kbd> to play
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAUSE OVERLAY
          ═══════════════════════════════════════════════════════════════ */}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-accent/60 sm:text-[10px]">⏸ Tạm dừng</div>
          <p className="relative mb-5 text-2xl font-black tracking-wider text-foreground sm:text-3xl" style={{ fontFamily: 'Orbitron, monospace' }}>
            PAUSED
          </p>
          <div className="relative flex gap-3">
            <button
              type="button"
              onClick={resumeGame}
              className="rounded-xl bg-gradient-to-r from-destructive to-accent px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-all hover:shadow-[0_0_35px_rgba(34,211,238,0.35)] hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-3 sm:text-sm"
            >
              Tiếp tục
            </button>
            <button
              type="button"
              onClick={goToMenu}
              className="rounded-xl border border-foreground/15 bg-foreground/[0.06] px-6 py-2.5 text-xs font-bold text-foreground/70 backdrop-blur-sm transition-all hover:bg-foreground/10 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-3 sm:text-sm"
            >
              Về menu
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          GAME OVER OVERLAY
          ═══════════════════════════════════════════════════════════════ */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-background/95 via-background/90 to-background/95 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(244,114,182,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(244,114,182,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-destructive/80 sm:text-[10px] sm:tracking-[0.4em]">⚠ System Collision ⚠</div>
          <p className="relative mb-4 text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-destructive to-destructive drop-shadow-[0_0_20px_rgba(244,114,182,0.3)] sm:mb-5 sm:text-3xl" style={{ fontFamily: 'Orbitron, monospace' }}>
            VA CHẠM HỆ THỐNG
          </p>

          <div className="relative mb-4 flex gap-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-6 py-3 backdrop-blur-sm sm:mb-5 sm:gap-6 sm:px-8 sm:py-4">
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-foreground/40 sm:text-[10px]">Score</div>
              <div className="font-mono text-xl font-bold text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] sm:text-3xl">
                {String(gsRef.current.score).padStart(6, '0')}
              </div>
            </div>
            <div className="w-px bg-foreground/10" />
            <div className="text-center">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-accent/50 sm:text-[10px]">Best</div>
              <div className="font-mono text-xl font-bold text-accent drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] sm:text-3xl">
                {String(gsRef.current.bestScore).padStart(6, '0')}
              </div>
            </div>
          </div>

          <p className="relative mb-4 text-[10px] text-foreground/25 sm:mb-5 sm:text-xs">MIU-9 cần nghỉ một chút 🐱</p>

          <div className="relative flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={startGame}
              className="rounded-xl bg-gradient-to-r from-destructive to-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-all hover:shadow-[0_0_35px_rgba(34,211,238,0.35)] hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-3 sm:text-sm"
            >
              Chơi lại
            </button>
            <button
              type="button"
              onClick={goToMenu}
              className="rounded-xl border border-foreground/15 bg-foreground/[0.06] px-5 py-2 text-xs font-bold text-foreground/70 backdrop-blur-sm transition-all hover:bg-foreground/10 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-3 sm:text-sm"
            >
              Thoát
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {isMobile && phase === 'playing' && (
        <MobileControls onAction={handleMobileAction} />
      )}

      {/* Desktop controls hint */}
      {!isMobile && phase === 'playing' && (
        <div className="flex gap-5 text-xs text-muted-foreground/40">
          <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/10 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px]">W</kbd> Nhảy</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/10 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px]">S</kbd> Ngồi</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/10 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px]">F</kbd> Bắn</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/10 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd> Tạm dừng</span>
        </div>
      )}
    </div>
  )
}
