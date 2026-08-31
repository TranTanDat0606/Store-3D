import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib'
import {
  PlayerFrog,
  PlayerFrogJump,
  PlayerFrogCrouch,
  EnemyRobot,
  BossFrog,
  EnergyBeam,
  EnemyLaser,
  AcidBlob,
  LavaSpit,
  EyeLaserBeam,
  Rocket,
  RollingRock,
  HealingHeart,
  Explosion,
  HitSpark,
  BossHealthBar,
  WarningIndicator,
} from './game-assets'
import { MobileControls } from './mobile-controls'

const ARENA_W = 400
const ARENA_H = 500
const GROUND_Y = ARENA_H - 50
const PLAYER_W = 40
const PLAYER_H = 44
const PLAYER_SPEED = 220
const JUMP_VELOCITY = -420
const GRAVITY = 980
const CROUCH_H = 28
const SHOOT_COOLDOWN = 350
const BEAM_SPEED = 450
const BEAM_W = 24
const BEAM_H = 8

const ENEMY_W = 34
const ENEMY_H = 34
const ENEMY_SPEED_MIN = 40
const ENEMY_SPEED_MAX = 80
const ENEMY_SHOOT_INTERVAL = 2200
const ENEMY_LASER_W = 20
const ENEMY_LASER_H = 6

const ROCKET_W = 32
const ROCKET_H = 14
const ROCKET_SPEED_MIN = 100
const ROCKET_SPEED_MAX = 180
const ROCKET_SPAWN_INTERVAL = 4000

const BOSS_W = 80
const BOSS_H = 80
const BOSS_HP = 60

const PHASE2_SCORE = 80

const ACID_W = 16
const ACID_H = 16
const ACID_SPEED = 150

const LAVA_W = 18
const LAVA_H = 18
const LAVA_SPEED = 180

const EYE_LASER_W = 60
const EYE_LASER_H = 8

const ROLLING_ROCK_W = 28
const ROLLING_ROCK_H = 28
const ROLLING_ROCK_SPEED = 160

const HEAL_W = 24
const HEAL_H = 24
const HEAL_SPAWN_TIME = 60000

const INVINCIBLE_DURATION = 400
const ENEMY_LASER_SPEED = 250
const BOSS_X = ARENA_W - BOSS_W - 20
const BOSS_PROJECTILE_SPEED = 280

let nextId = 1

interface Projectile {
  id: number
  x: number
  y: number
  type: 'beam' | 'enemy_laser' | 'acid' | 'lava' | 'eye_laser'
  damage: number
  phase?: 1 | 2
}

interface Enemy {
  id: number
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  lastShot: number
  dying: boolean
  deathTimer: number
  variant: 'normal' | 'fast' | 'tank'
}

interface RocketObj {
  id: number
  x: number
  y: number
  speedX: number
  speedY: number
  warning: boolean
  warningTimer: number
}

interface RollingRockObj {
  id: number
  x: number
  y: number
  speedX: number
}

interface HealObj {
  id: number
  x: number
  y: number
}

type BossState = 'idle' | 'targeting' | 'telegraph' | 'attacking' | 'cooldown' | 'phase_transition' | 'defeated'

interface BossObj {
  hp: number
  maxHp: number
  phase: 1 | 2
  state: BossState
  stateTimer: number
  attackType: 'eye_laser' | 'acid_tongue' | 'lava_spit' | 'rolling_rock'
  cooldownDuration: number
  appeared: boolean
  y: number
}

interface Effect {
  id: number
  x: number
  y: number
  type: 'explosion' | 'spark'
  timer: number
}

interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  crouch: boolean
  shoot: boolean
}

interface FrogCatcherProps {
  onGameEnd: (score: number) => void
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function FrogCatcher({ onGameEnd }: FrogCatcherProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover' | 'victory'>('intro')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [playerX, setPlayerX] = useState(60)
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_H)
  const [isJumping, setIsJumping] = useState(false)
  const [isCrouching, setIsCrouching] = useState(false)
  const [facingRight, setFacingRight] = useState(true)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [rockets, setRockets] = useState<RocketObj[]>([])
  const [rollingRocks, setRollingRocks] = useState<RollingRockObj[]>([])
  const [heal, setHeal] = useState<HealObj | null>(null)
  const [boss, setBoss] = useState<BossObj | null>(null)
  const [effects, setEffects] = useState<Effect[]>([])
  const [bossActive, setBossActive] = useState(false)
  const [hitFlash, setHitFlash] = useState(false)
  const [invincible, setInvincible] = useState(false)
  const invincibleTimerRef = useRef(0)
  const [shakeScreen, setShakeScreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const playerXRef = useRef(60)
  const playerYRef = useRef(GROUND_Y - PLAYER_H)
  const vyRef = useRef(0)
  const isJumpingRef = useRef(false)
  const isCrouchingRef = useRef(false)
  const livesRef = useRef(3)
  const scoreRef = useRef(0)
  const gameOverRef = useRef(false)
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, crouch: false, shoot: false })
  const lastShotRef = useRef(0)
  const lastEnemySpawnRef = useRef(0)
  const lastRocketSpawnRef = useRef(0)
  const startTimeRef = useRef(0)
  const bossRef = useRef<BossObj | null>(null)
  const enemiesRef = useRef<Enemy[]>([])
  const projectilesRef = useRef<Projectile[]>([])
  const rocketsRef = useRef<RocketObj[]>([])
  const rollingRocksRef = useRef<RollingRockObj[]>([])
  const healRef = useRef<HealObj | null>(null)
  const effectsRef = useRef<Effect[]>([])
  const lastFrameRef = useRef(0)
  const jumpPressedRef = useRef(false)

  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const spawnEnemy = useCallback(() => {
    const variants: ('normal' | 'fast' | 'tank')[] = ['normal', 'normal', 'normal', 'fast', 'tank']
    const variant = variants[Math.floor(Math.random() * variants.length)]
    const hpMap = { normal: 2, fast: 1, tank: 4 }
    const speedMap = { normal: 1, fast: 1.5, tank: 0.6 }
    const baseSpeed = ENEMY_SPEED_MIN + Math.random() * (ENEMY_SPEED_MAX - ENEMY_SPEED_MIN)
    const e: Enemy = {
      id: nextId++,
      x: ARENA_W + 10,
      y: GROUND_Y - ENEMY_H - Math.random() * 100,
      hp: hpMap[variant],
      maxHp: hpMap[variant],
      speed: baseSpeed * speedMap[variant],
      lastShot: performance.now() + 1000 + Math.random() * 1500,
      dying: false,
      deathTimer: 0,
      variant,
    }
    enemiesRef.current = [...enemiesRef.current, e]
    setEnemies([...enemiesRef.current])
  }, [])

  const spawnRocket = useCallback(() => {
    const fromTop = Math.random() > 0.5
    const r: RocketObj = {
      id: nextId++,
      x: Math.random() * (ARENA_W - 100) + 50,
      y: fromTop ? -ROCKET_H : ARENA_H + ROCKET_H,
      speedX: (Math.random() - 0.5) * 60,
      speedY: fromTop ? ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN) : -(ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN)),
      warning: true,
      warningTimer: 800,
    }
    rocketsRef.current = [...rocketsRef.current, r]
    setRockets([...rocketsRef.current])
  }, [])

  const spawnRollingRock = useCallback(() => {
    const fromRight = Math.random() > 0.5
    const r: RollingRockObj = {
      id: nextId++,
      x: fromRight ? ARENA_W + ROLLING_ROCK_W : -ROLLING_ROCK_W,
      y: GROUND_Y - ROLLING_ROCK_H - 5,
      speedX: fromRight ? -ROLLING_ROCK_SPEED : ROLLING_ROCK_SPEED,
    }
    rollingRocksRef.current = [...rollingRocksRef.current, r]
    setRollingRocks([...rollingRocksRef.current])
  }, [])

  const addEffect = useCallback((x: number, y: number, type: 'explosion' | 'spark') => {
    const e: Effect = { id: nextId++, x, y, type, timer: 400 }
    effectsRef.current = [...effectsRef.current, e]
    setEffects([...effectsRef.current])
  }, [])

  const damagePlayer = useCallback((amount: number) => {
    if (gameOverRef.current) return
    if (invincibleTimerRef.current > 0) return
    const newLives = Math.max(0, livesRef.current - amount)
    livesRef.current = newLives
    setLives(newLives)
    invincibleTimerRef.current = INVINCIBLE_DURATION
    setInvincible(true)
    setHitFlash(true)
    setTimeout(() => setHitFlash(false), 200)
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 150)
    if (newLives <= 0) {
      gameOverRef.current = true
      setGameState('gameover')
    }
  }, [onGameEnd])

  const shootBeam = useCallback(() => {
    const now = performance.now()
    if (now - lastShotRef.current < SHOOT_COOLDOWN) return
    lastShotRef.current = now
    const b: Projectile = {
      id: nextId++,
      x: playerXRef.current + PLAYER_W,
      y: playerYRef.current + (isCrouchingRef.current ? CROUCH_H / 2 : PLAYER_H / 2) - BEAM_H / 2,
      type: 'beam',
      damage: 1,
    }
    projectilesRef.current = [...projectilesRef.current, b]
    setProjectiles([...projectilesRef.current])
  }, [])

  const bossShoot = useCallback((b: BossObj, attackType: string) => {
    const bx = BOSS_X
    const bossCenterY = b.y + BOSS_H / 2

    if (attackType === 'eye_laser') {
      const p: Projectile = {
        id: nextId++,
        x: bx - EYE_LASER_W,
        y: bossCenterY - EYE_LASER_H / 2,
        type: 'eye_laser',
        damage: 1,
        phase: b.phase,
      }
      projectilesRef.current = [...projectilesRef.current, p]
      setProjectiles([...projectilesRef.current])
    } else if (attackType === 'acid_tongue') {
      const p: Projectile = {
        id: nextId++,
        x: bx - ACID_W,
        y: bossCenterY - ACID_H / 2,
        type: 'acid',
        damage: 1,
      }
      projectilesRef.current = [...projectilesRef.current, p]
      setProjectiles([...projectilesRef.current])
    } else if (attackType === 'lava_spit') {
      const p: Projectile = {
        id: nextId++,
        x: bx - LAVA_W,
        y: bossCenterY - LAVA_H / 2,
        type: 'lava',
        damage: 1,
      }
      projectilesRef.current = [...projectilesRef.current, p]
      setProjectiles([...projectilesRef.current])
    } else if (attackType === 'rolling_rock') {
      spawnRollingRock()
    }
  }, [spawnRollingRock])

  const handleMobileAction = useCallback((action: string) => {
    switch (action) {
      case 'left':
        inputRef.current.left = true
        setFacingRight(false)
        break
      case 'right':
        inputRef.current.right = true
        setFacingRight(true)
        break
      case 'left_up':
        inputRef.current.left = false
        break
      case 'right_up':
        inputRef.current.right = false
        break
      case 'jump':
        if (!isJumpingRef.current) {
          inputRef.current.jump = true
        }
        break
      case 'crouch':
        inputRef.current.crouch = true
        break
      case 'crouch_up':
        inputRef.current.crouch = false
        break
      case 'shoot':
        shootBeam()
        break
    }
  }, [shootBeam])

  useEffect(() => {
    if (gameState !== 'playing') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'a' || key === 'arrowleft') { e.preventDefault(); inputRef.current.left = true; setFacingRight(false) }
      if (key === 'd' || key === 'arrowright') { e.preventDefault(); inputRef.current.right = true; setFacingRight(true) }
      if ((key === ' ' || key === 'arrowup') && !jumpPressedRef.current) { e.preventDefault(); inputRef.current.jump = true; jumpPressedRef.current = true }
      if (key === 's' || key === 'arrowdown') { e.preventDefault(); inputRef.current.crouch = true }
      if (key === 'f') { e.preventDefault(); shootBeam() }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = false
      if (key === 'd' || key === 'arrowright') inputRef.current.right = false
      if (key === ' ' || key === 'arrowup') { inputRef.current.jump = false; jumpPressedRef.current = false }
      if (key === 's' || key === 'arrowdown') inputRef.current.crouch = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, shootBeam])

  useEffect(() => {
    if (gameState !== 'playing') return

    let animFrame: number
    lastFrameRef.current = performance.now()
    startTimeRef.current = performance.now()

    const loop = (now: number) => {
      if (gameOverRef.current) return

      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05)
      lastFrameRef.current = now
      const elapsed = now - startTimeRef.current

      if (invincibleTimerRef.current > 0) {
        invincibleTimerRef.current -= dt * 1000
        if (invincibleTimerRef.current <= 0) {
          invincibleTimerRef.current = 0
          setInvincible(false)
        }
      }

      const input = inputRef.current
      let px = playerXRef.current
      let py = playerYRef.current
      let vy = vyRef.current
      const jumping = isJumpingRef.current
      const crouching = input.crouch

      if (!jumping && input.jump) {
        vy = JUMP_VELOCITY
        vyRef.current = vy
        isJumpingRef.current = true
        setIsJumping(true)
        input.jump = false
      }

      if (input.left) {
        px = Math.max(0, px - PLAYER_SPEED * dt)
        setFacingRight(false)
      }
      if (input.right) {
        px = Math.min(ARENA_W - PLAYER_W, px + PLAYER_SPEED * dt)
        setFacingRight(true)
      }

      if (jumping) {
        vy += GRAVITY * dt
        py += vy * dt
        if (py >= GROUND_Y - PLAYER_H) {
          py = GROUND_Y - PLAYER_H
          vy = 0
          isJumpingRef.current = false
          setIsJumping(false)
        }
      }

      if (crouching && !jumping) {
        py = GROUND_Y - CROUCH_H
      } else if (!jumping) {
        py = GROUND_Y - PLAYER_H
      }

      isCrouchingRef.current = crouching
      setIsCrouching(crouching)
      playerXRef.current = px
      playerYRef.current = py
      vyRef.current = vy
      setPlayerX(px)
      setPlayerY(py)

      // Spawn enemies
      const spawnRate = Math.max(1200 - elapsed * 0.08, 500)
      if (now - lastEnemySpawnRef.current > spawnRate && !bossRef.current) {
        lastEnemySpawnRef.current = now
        spawnEnemy()
      }

      // Spawn rockets
      const rocketRate = Math.max(ROCKET_SPAWN_INTERVAL - elapsed * 0.05, 1500)
      if (now - lastRocketSpawnRef.current > rocketRate && !bossRef.current) {
        lastRocketSpawnRef.current = now
        spawnRocket()
      }

      // Spawn healing heart
      if (elapsed > HEAL_SPAWN_TIME && !healRef.current && livesRef.current < 3) {
        const h: HealObj = {
          id: nextId++,
          x: 100 + Math.random() * (ARENA_W - 200),
          y: 50 + Math.random() * 100,
        }
        healRef.current = h
        setHeal(h)
      }

      // Update enemies
      const updatedEnemies: Enemy[] = []
      for (const e of enemiesRef.current) {
        if (e.dying) {
          e.deathTimer -= dt * 1000
          if (e.deathTimer > 0) {
            updatedEnemies.push(e)
          }
          continue
        }

        e.x -= e.speed * dt

        if (now > e.lastShot) {
          e.lastShot = now + ENEMY_SHOOT_INTERVAL
          const lp: Projectile = {
            id: nextId++,
            x: e.x - ENEMY_LASER_W,
            y: e.y + ENEMY_H / 2 - ENEMY_LASER_H / 2,
            type: 'enemy_laser',
            damage: 1,
          }
          projectilesRef.current = [...projectilesRef.current, lp]
        }

        if (e.x < -ENEMY_W) continue
        updatedEnemies.push(e)
      }
      enemiesRef.current = updatedEnemies
      setEnemies([...updatedEnemies])

      // Update projectiles
      const updatedProjectiles: Projectile[] = []
      for (const p of projectilesRef.current) {
        if (p.type === 'beam') {
          p.x += BEAM_SPEED * dt
          if (p.x > ARENA_W + 10) continue

          for (const e of enemiesRef.current) {
            if (e.dying) continue
            if (rectsOverlap(p.x, p.y, BEAM_W, BEAM_H, e.x, e.y, ENEMY_W, ENEMY_H)) {
              e.hp -= p.damage
              addEffect(p.x, p.y, 'spark')
              if (e.hp <= 0) {
                e.dying = true
                e.deathTimer = 300
                const pts = e.variant === 'tank' ? 8 : e.variant === 'fast' ? 6 : 4
                scoreRef.current += pts
                setScore(scoreRef.current)
                addEffect(e.x + ENEMY_W / 2, e.y + ENEMY_H / 2, 'explosion')
              }
              p.x = ARENA_W + 100
              break
            }
          }

          if (bossRef.current && bossRef.current.hp > 0 && bossRef.current.state !== 'phase_transition' && bossRef.current.state !== 'defeated') {
            const b = bossRef.current
            if (rectsOverlap(p.x, p.y, BEAM_W, BEAM_H, BOSS_X, b.y, BOSS_W, BOSS_H)) {
              b.hp -= p.damage
              addEffect(p.x, p.y, 'spark')
              if (b.hp <= 0 && b.state !== 'defeated') {
                b.state = 'defeated'
                b.stateTimer = 2000
                scoreRef.current += 50
                setScore(scoreRef.current)
                addEffect(20 + BOSS_W / 2, b.y + BOSS_H / 2, 'explosion')
              }
              p.x = ARENA_W + 100
            }
          }
        } else {
          const speed = p.type === 'eye_laser' ? BOSS_PROJECTILE_SPEED : p.type === 'enemy_laser' ? ENEMY_LASER_SPEED : p.type === 'lava' ? LAVA_SPEED : ACID_SPEED
          p.x -= speed * dt
          if (p.x < -60) continue

          const ph = p.type === 'eye_laser' ? EYE_LASER_H : p.type === 'enemy_laser' ? ENEMY_LASER_H : p.type === 'lava' ? LAVA_H : ACID_H
          const pw = p.type === 'eye_laser' ? EYE_LASER_W : p.type === 'enemy_laser' ? ENEMY_LASER_W : p.type === 'lava' ? LAVA_W : ACID_W
          const playerH = crouching ? CROUCH_H : PLAYER_H

          if (rectsOverlap(p.x, p.y, pw, ph, px, py, PLAYER_W, playerH)) {
            damagePlayer(p.damage)
            addEffect(px + PLAYER_W / 2, py, 'spark')
            p.x = -100
            continue
          }
        }

        updatedProjectiles.push(p)
      }
      projectilesRef.current = updatedProjectiles
      setProjectiles([...updatedProjectiles])

      // Update rockets
      const updatedRockets: RocketObj[] = []
      for (const r of rocketsRef.current) {
        if (r.warning) {
          r.warningTimer -= dt * 1000
          if (r.warningTimer <= 0) {
            r.warning = false
          }
          updatedRockets.push(r)
          continue
        }

        r.x += r.speedX * dt
        r.y += r.speedY * dt

        if (r.y < -ROCKET_H * 2 || r.y > ARENA_H + ROCKET_H * 2 || r.x < -ROCKET_W * 2 || r.x > ARENA_W + ROCKET_W * 2) continue

        const playerH = crouching ? CROUCH_H : PLAYER_H
        if (rectsOverlap(r.x, r.y, ROCKET_W, ROCKET_H, px, py, PLAYER_W, playerH)) {
          damagePlayer(1)
          addEffect(r.x + ROCKET_W / 2, r.y + ROCKET_H / 2, 'explosion')
          continue
        }

        updatedRockets.push(r)
      }
      rocketsRef.current = updatedRockets
      setRockets([...updatedRockets])

      // Update rolling rocks
      const updatedRR: RollingRockObj[] = []
      for (const r of rollingRocksRef.current) {
        r.x += r.speedX * dt
        if (r.x < -ROLLING_ROCK_W * 2 || r.x > ARENA_W + ROLLING_ROCK_W * 2) continue

        const playerH = crouching ? CROUCH_H : PLAYER_H
        if (rectsOverlap(r.x, r.y, ROLLING_ROCK_W, ROLLING_ROCK_H, px, py, PLAYER_W, playerH)) {
          damagePlayer(1.5)
          addEffect(r.x + ROLLING_ROCK_W / 2, r.y + ROLLING_ROCK_H / 2, 'explosion')
          continue
        }

        updatedRR.push(r)
      }
      rollingRocksRef.current = updatedRR
      setRollingRocks([...updatedRR])

      // Update healing heart
      if (healRef.current) {
        const h = healRef.current
        const playerH = crouching ? CROUCH_H : PLAYER_H
        if (rectsOverlap(h.x, h.y, HEAL_W, HEAL_H, px, py, PLAYER_W, playerH)) {
          livesRef.current = Math.min(3, livesRef.current + 1)
          setLives(livesRef.current)
          healRef.current = null
          setHeal(null)
          addEffect(h.x + HEAL_W / 2, h.y + HEAL_H / 2, 'spark')
        }
      }

      // Update boss
      if (bossRef.current) {
        const b = bossRef.current

        if (!b.appeared) {
          b.y = 30
          b.appeared = true
        }

        b.stateTimer -= dt * 1000

        if (b.state === 'phase_transition') {
          if (b.stateTimer <= 0) {
            b.phase = 2
            b.state = 'idle'
            b.stateTimer = 1000
            b.cooldownDuration = 1200
          }
        } else if (b.state === 'defeated') {
          if (b.stateTimer <= 0) {
            bossRef.current = null
            setBoss(null)
            setBossActive(false)
          }
        } else if (b.state === 'idle') {
          if (b.stateTimer <= 0) {
            b.state = 'targeting'
            b.stateTimer = 500
          }
        } else if (b.state === 'targeting') {
          if (b.stateTimer <= 0) {
            const attacks = b.phase === 1
              ? ['eye_laser', 'acid_tongue']
              : ['lava_spit', 'eye_laser', 'rolling_rock']
            b.attackType = attacks[Math.floor(Math.random() * attacks.length)] as typeof b.attackType
            b.state = 'telegraph'
            b.stateTimer = b.phase === 2 ? 400 : 600
          }
        } else if (b.state === 'telegraph') {
          if (b.stateTimer <= 0) {
            bossShoot(b, b.attackType)
            b.state = 'attacking'
            b.stateTimer = b.phase === 2 ? 300 : 500
          }
        } else if (b.state === 'attacking') {
          if (b.stateTimer <= 0) {
            b.state = 'cooldown'
            b.stateTimer = b.cooldownDuration
          }
        } else if (b.state === 'cooldown') {
          if (b.stateTimer <= 0) {
            b.state = 'idle'
            b.stateTimer = 400
          }
        }

        // Check score for phase 2 transition
        if (b.phase === 1 && scoreRef.current >= PHASE2_SCORE && b.state !== 'phase_transition' && b.state !== 'defeated') {
          b.state = 'phase_transition'
          b.stateTimer = 1500
          b.cooldownDuration = 800
          addEffect(20 + BOSS_W / 2, b.y + BOSS_H / 2, 'explosion')
        }

        setBoss({ ...b })
      }

      // Boss spawn logic
      if (!bossRef.current && scoreRef.current >= 20 && enemiesRef.current.length === 0) {
        const b: BossObj = {
          hp: BOSS_HP,
          maxHp: BOSS_HP,
          phase: 1,
          state: 'idle',
          stateTimer: 2000,
          attackType: 'eye_laser',
          cooldownDuration: 2000,
          appeared: false,
          y: -BOSS_H,
        }
        bossRef.current = b
        setBoss({ ...b })
        setBossActive(true)
        enemiesRef.current = []
        setEnemies([])
      }

      // Update effects
      const updatedEffects: Effect[] = []
      for (const e of effectsRef.current) {
        e.timer -= dt * 1000
        if (e.timer > 0) updatedEffects.push(e)
      }
      effectsRef.current = updatedEffects
      setEffects([...updatedEffects])

      // Victory check
      if (bossRef.current && bossRef.current.hp <= 0 && bossRef.current.state === 'defeated' && bossRef.current.stateTimer <= 500) {
        gameOverRef.current = true
        setGameState('victory')
        return
      }

      animFrame = requestAnimationFrame(loop)
    }

    animFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame)
  }, [gameState, spawnEnemy, spawnRocket, damagePlayer, bossShoot, addEffect, onGameEnd])

  const handleStart = useCallback(() => {
    nextId = 1
    playerXRef.current = 60
    playerYRef.current = GROUND_Y - PLAYER_H
    vyRef.current = 0
    isJumpingRef.current = false
    isCrouchingRef.current = false
    livesRef.current = 3
    scoreRef.current = 0
    gameOverRef.current = false
    enemiesRef.current = []
    projectilesRef.current = []
    rocketsRef.current = []
    rollingRocksRef.current = []
    healRef.current = null
    bossRef.current = null
    effectsRef.current = []
    lastEnemySpawnRef.current = 0
    lastRocketSpawnRef.current = 0
    lastShotRef.current = 0
    jumpPressedRef.current = false

    setPlayerX(60)
    setPlayerY(GROUND_Y - PLAYER_H)
    setLives(3)
    setScore(0)
    setEnemies([])
    setProjectiles([])
    setRockets([])
    setRollingRocks([])
    setHeal(null)
    setBoss(null)
    setBossActive(false)
    setEffects([])
    setInvincible(false)
    invincibleTimerRef.current = 0
    setGameState('playing')
  }, [])

  const playerH = isCrouching ? CROUCH_H : PLAYER_H

  const renderPlayer = useMemo(() => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: playerX,
      top: playerY,
      width: PLAYER_W,
      height: playerH,
      transform: facingRight ? 'none' : 'scaleX(-1)',
      transition: 'top 0.05s',
      zIndex: 20,
    }

    if (hitFlash) {
      style.filter = 'brightness(2) saturate(0)'
      style.opacity = 0.7
    } else if (invincible) {
      style.opacity = 0.4 + Math.sin(performance.now() * 0.02) * 0.3
    }

    if (isJumping) {
      return <PlayerFrogJump className="absolute" style={style} />
    }
    if (isCrouching) {
      return <PlayerFrogCrouch className="absolute" style={style} />
    }
    return <PlayerFrog className="absolute" style={style} />
  }, [playerX, playerY, playerH, facingRight, isJumping, isCrouching, hitFlash, invincible])

  return (
    <div className="flex flex-col items-center gap-2">
      {/* HUD */}
      <div className="flex w-full items-center justify-between px-1">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => {
            const heartLife = lives - i
            if (heartLife >= 1) {
              return <Heart key={i} className="size-5 fill-red-500 text-red-500" />
            }
            if (heartLife >= 0.5) {
              return (
                <div key={i} className="relative size-5">
                  <Heart className="absolute size-5 text-muted-foreground/30" />
                  <div className="absolute size-5 overflow-hidden" style={{ width: '50%' }}>
                    <Heart className="size-5 fill-red-500 text-red-500" />
                  </div>
                </div>
              )
            }
            return <Heart key={i} className="size-5 text-muted-foreground/30" />
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums">{score}</span>
        </div>
      </div>

      {/* Boss HP */}
      {bossActive && boss && (
        <div className="w-full px-1">
          <BossHealthBar hp={boss.hp} maxHp={boss.maxHp} phase={boss.phase} />
        </div>
      )}

      {/* Arena */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2',
          'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
          hitFlash && 'ring-2 ring-red-500',
          shakeScreen && 'animate-[shake_0.15s_ease-in-out]',
        )}
        style={{
          width: ARENA_W,
          height: ARENA_H,
          maxWidth: '100%',
          aspectRatio: `${ARENA_W}/${ARENA_H}`,
        }}
      >
        {/* Grid background */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`h${i}`} className="absolute w-full border-t border-cyan-500/30" style={{ top: `${(i + 1) * 5}%` }} />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={`v${i}`} className="absolute h-full border-l border-cyan-500/30" style={{ left: `${(i + 1) * 6.67}%` }} />
          ))}
        </div>

        {/* Ground */}
        <div
          className="absolute bottom-0 w-full"
          style={{
            height: ARENA_H - GROUND_Y,
            background: 'linear-gradient(to bottom, #164e63, #0c4a6e)',
            borderTop: '2px solid #22d3ee',
            boxShadow: '0 -4px 12px rgba(34,211,238,0.3)',
          }}
        />

        {/* Intro screen */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <PlayerFrog className="mb-4" style={{ width: 64, height: 64 }} />
            <h3 className="mb-2 text-lg font-bold text-white">Frog Robot Fighter</h3>
            <p className="mb-4 max-w-[280px] text-center text-xs text-white/70">
              Di chuyển, nhảy, né tránh và bắn kẻ thù!
            </p>
            <div className="mb-4 space-y-1 text-center text-[10px] text-white/50">
              <p>A/D hoặc ←/→ = Di chuyển</p>
              <p>Space = Nhảy | S = Rạp | F = Bắn</p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              Bắt đầu
            </button>
          </div>
        )}

        {/* Enemies */}
        {enemies.map((e) => (
          <div
            key={e.id}
            className={cn('absolute', e.dying && 'animate-[fadeOut_0.3s]')}
            style={{
              left: e.x,
              top: e.y,
              width: ENEMY_W,
              height: ENEMY_H,
              opacity: e.dying ? 0.3 : 1,
              filter: e.hp < e.maxHp ? 'brightness(1.5)' : undefined,
              transition: 'filter 0.1s',
            }}
          >
            <EnemyRobot variant={e.variant} style={{ width: '100%', height: '100%' }} />
            {e.hp < e.maxHp && !e.dying && (
              <div className="absolute -top-1 left-0 h-1 w-full overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Player projectiles */}
        {projectiles.map((p) => {
          if (p.type === 'beam') {
            return (
              <EnergyBeam
                key={p.id}
                className="absolute"
                style={{ left: p.x, top: p.y, width: BEAM_W, height: BEAM_H }}
              />
            )
          }
          if (p.type === 'enemy_laser') {
            return (
              <EnemyLaser
                key={p.id}
                className="absolute"
                style={{ left: p.x, top: p.y, width: ENEMY_LASER_W, height: ENEMY_LASER_H }}
              />
            )
          }
          if (p.type === 'acid') {
            return (
              <AcidBlob
                key={p.id}
                className="absolute"
                style={{ left: p.x, top: p.y, width: ACID_W, height: ACID_H }}
              />
            )
          }
          if (p.type === 'lava') {
            return (
              <LavaSpit
                key={p.id}
                className="absolute"
                style={{ left: p.x, top: p.y, width: LAVA_W, height: LAVA_H }}
              />
            )
          }
          if (p.type === 'eye_laser') {
            return (
              <EyeLaserBeam
                key={p.id}
                className="absolute"
                phase={p.phase}
                style={{ left: p.x, top: p.y, width: EYE_LASER_W, height: EYE_LASER_H }}
              />
            )
          }
          return null
        })}

        {/* Rockets */}
        {rockets.map((r) => (
          <div key={r.id}>
            {r.warning ? (
              <WarningIndicator
                className="absolute"
                style={{ left: r.x, top: r.y > ARENA_H / 2 ? ARENA_H - 20 : 5, width: 16, height: 14 }}
              />
            ) : (
              <Rocket
                className="absolute"
                style={{ left: r.x, top: r.y, width: ROCKET_W, height: ROCKET_H }}
                direction={r.speedX > 0 ? 'right' : 'left'}
              />
            )}
          </div>
        ))}

        {/* Rolling rocks */}
        {rollingRocks.map((r) => (
          <RollingRock
            key={r.id}
            className="absolute"
            style={{ left: r.x, top: r.y, width: ROLLING_ROCK_W, height: ROLLING_ROCK_H }}
          />
        ))}

        {/* Healing heart */}
        {heal && (
          <HealingHeart
            className="absolute"
            style={{ left: heal.x, top: heal.y, width: HEAL_W, height: HEAL_H }}
          />
        )}

        {/* Boss */}
        {boss && boss.appeared && boss.state !== 'defeated' && (
          <BossFrog
            className={cn(
              'absolute',
              boss.state === 'telegraph' && 'animate-pulse',
            )}
            phase={boss.phase}
            style={{
              left: BOSS_X,
              top: boss.y,
              width: BOSS_W,
              height: BOSS_H,
              transition: boss.state === 'phase_transition' ? 'all 0.5s' : undefined,
              filter: boss.state === 'telegraph' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(239,68,68,0.8))' : undefined,
            }}
          />
        )}

        {/* Boss death explosion */}
        {boss && boss.state === 'defeated' && (
          <Explosion
            className="absolute"
            style={{
              left: BOSS_X + BOSS_W / 2 - 32,
              top: boss.y + BOSS_H / 2 - 32,
              width: 64,
              height: 64,
              animation: 'pulse 0.3s infinite',
            }}
          />
        )}

        {/* Phase transition effect */}
        {boss && boss.state === 'phase_transition' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-500/20 backdrop-blur-[1px]">
            <span className="animate-bounce text-lg font-black tracking-wider text-red-400 drop-shadow-lg">
              PHASE 2
            </span>
          </div>
        )}

        {/* Effects */}
        {effects.map((e) => (
          <div
            key={e.id}
            className="absolute pointer-events-none"
            style={{
              left: e.x - (e.type === 'explosion' ? 16 : 10),
              top: e.y - (e.type === 'explosion' ? 16 : 10),
              width: e.type === 'explosion' ? 32 : 20,
              height: e.type === 'explosion' ? 32 : 20,
              opacity: e.timer / 400,
            }}
          >
            {e.type === 'explosion' ? (
              <Explosion style={{ width: '100%', height: '100%' }} />
            ) : (
              <HitSpark style={{ width: '100%', height: '100%' }} />
            )}
          </div>
        ))}

        {/* Player */}
        {renderPlayer}

        {/* Game Over overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <p className="mb-1 text-2xl font-black tracking-wider text-red-400">GAME OVER</p>
            <p className="mb-4 text-lg font-bold text-white">Điểm: {score}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg active:scale-95"
              >
                Chơi lại
              </button>
              <button
                type="button"
                onClick={() => onGameEnd(scoreRef.current)}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 text-sm font-bold text-white/80 hover:bg-white/20 active:scale-95"
              >
                Thoát
              </button>
            </div>
          </div>
        )}

        {/* Victory overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <p className="mb-1 text-2xl font-black tracking-wider text-amber-400">BOSS DEFEATED!</p>
            <p className="mb-4 text-lg font-bold text-white">Điểm: {score}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg active:scale-95"
              >
                Chơi lại
              </button>
              <button
                type="button"
                onClick={() => onGameEnd(scoreRef.current)}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 text-sm font-bold text-white/80 hover:bg-white/20 active:scale-95"
              >
                Nhận thưởng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      {isMobile && gameState === 'playing' && (
        <MobileControls onAction={handleMobileAction} />
      )}

      {/* Controls hint (desktop) */}
      {!isMobile && gameState === 'playing' && (
        <div className="flex gap-3 text-[10px] text-muted-foreground/60">
          <span>A/D: Di chuyển</span>
          <span>Space: Nhảy</span>
          <span>S: Rạp</span>
          <span>F: Bắn</span>
        </div>
      )}
    </div>
  )
}
