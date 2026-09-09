// client/src/components/mini-game/game-state.ts
// Pure game update logic — NO rendering calls

// ── Canvas dimensions (16:9) ──────────────────────────────────────────
export const CANVAS_W = 1280
export const CANVAS_H = 720
export const GROUND_Y = 610
export const GROUND_H = CANVAS_H - GROUND_Y

// ── Player ────────────────────────────────────────────────────────────
export const PLAYER_X = 120
export const PLAYER_W = 48
export const PLAYER_H = 52
export const PLAYER_DUCK_H = 30
export const JUMP_VEL = -580
export const GRAVITY = 1400

// ── Player Laser ──────────────────────────────────────────────────────
export const LASER_SPEED = 600
export const LASER_W = 50
export const LASER_H = 6
export const SHOOT_COOLDOWN = 750

// ── Enemy Laser (bird) ────────────────────────────────────────────────
export const ENEMY_LASER_SPEED = 400
export const ENEMY_LASER_W = 24
export const ENEMY_LASER_H = 4
export const BIRD_LASER_INTERVAL = 3000

// ── Obstacles ─────────────────────────────────────────────────────────
export const ROBOT_W = 44
export const ROBOT_H = 48
export const BIRD_W = 52
export const BIRD_H = 40
export const BIRD_Y_BASE = GROUND_Y - 130
export const MOUSE_W = 48
export const MOUSE_H = 44

// ── Lives ─────────────────────────────────────────────────────────────
export const MAX_LIVES = 3
export const INVINCIBILITY_MS = 2000

// ── Scoring (kill-only) ──────────────────────────────────────────────
export const DESTROY_ROBOT = 2
export const DESTROY_BIRD = 4
export const DESTROY_MOUSE = 2
export const BEST_KEY = 'miu9_best_score'

// ── Speed ─────────────────────────────────────────────────────────────
export const SPEED_BASE = 220
export const SPEED_MAX = 500
export const SPEED_RAMP = 0.08

// ── Spawn ─────────────────────────────────────────────────────────────
export const SPAWN_MIN = 800
export const SPAWN_MAX = 2200

// ── Mouse charge ──────────────────────────────────────────────────────
export const MOUSE_CHARGE_SPEED_MULT = 2.5
export const MOUSE_WARNING_TRIGGER = 0.6

// ── Types ─────────────────────────────────────────────────────────────
export type GamePhase = 'idle' | 'menu' | 'loading' | 'playing' | 'paused' | 'gameover'
export type ObstacleKind = 'robot' | 'bird' | 'mouse'

export interface Obstacle {
  id: number
  kind: ObstacleKind
  x: number
  y: number
  w: number
  h: number
  hp: number
  speed: number
  alive: boolean
  flash: number
  lastLaserTime: number
  isCharging: boolean
  chargeTriggered: boolean
}

export interface Laser {
  id: number
  x: number
  y: number
}

export interface EnemyLaser {
  id: number
  x: number
  y: number
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  maxLife: number
}

export interface GameInput {
  jumpQueued: boolean
  ducking: boolean
  shootRequested: boolean
}

export interface GameState {
  phase: GamePhase
  playerY: number
  velY: number
  isJumping: boolean
  isDucking: boolean
  score: number
  bestScore: number
  lives: number
  obstacles: Obstacle[]
  lasers: Laser[]
  enemyLasers: EnemyLaser[]
  particles: Particle[]
  floatingTexts: FloatingText[]
  scrollOffset: number
  bgOffset: number
  speed: number
  spawnTimer: number
  lastShot: number
  invTimer: number
  shakeTimer: number
  hitStopTimer: number
  elapsed: number
  groundLines: { x: number; w: number }[]
  nextId: number
  // Slow-motion for game-over effect
  slowMotionTimer: number
  slowMotionScale: number
}

export function loadBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0
  } catch { return 0 }
}

export function saveBest(v: number) {
  try { localStorage.setItem(BEST_KEY, String(v)) } catch { /* noop */ }
}

export function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function createInitialState(): GameState {
  return {
    phase: 'menu',
    playerY: GROUND_Y - PLAYER_H,
    velY: 0,
    isJumping: false,
    isDucking: false,
    score: 0,
    bestScore: loadBest(),
    lives: MAX_LIVES,
    obstacles: [],
    lasers: [],
    enemyLasers: [],
    particles: [],
    floatingTexts: [],
    scrollOffset: 0,
    bgOffset: 0,
    speed: SPEED_BASE,
    spawnTimer: 0,
    lastShot: 0,
    invTimer: 0,
    shakeTimer: 0,
    hitStopTimer: 0,
    elapsed: 0,
    groundLines: Array.from({ length: 40 }, (_, i) => ({ x: i * 60, w: 30 + (i * 17) % 30 })),
    nextId: 1,
    slowMotionTimer: 0,
    slowMotionScale: 1,
  }
}

export function spawnObstacle(gs: GameState) {
  const r = Math.random()
  let kind: ObstacleKind
  if (r < 0.35) kind = 'robot'
  else if (r < 0.65) kind = 'bird'
  else kind = 'mouse'

  const id = gs.nextId++
  if (kind === 'robot') {
    gs.obstacles.push({
      id, kind, x: CANVAS_W + 20,
      y: GROUND_Y - ROBOT_H,
      w: ROBOT_W, h: ROBOT_H,
      hp: 1, speed: gs.speed * 0.8,
      alive: true, flash: 0,
      lastLaserTime: 0, isCharging: false, chargeTriggered: false,
    })
  } else if (kind === 'bird') {
    gs.obstacles.push({
      id, kind, x: CANVAS_W + 20,
      y: BIRD_Y_BASE,
      w: BIRD_W, h: BIRD_H,
      hp: 1, speed: gs.speed * 0.7,
      alive: true, flash: 0,
      lastLaserTime: gs.elapsed, isCharging: false, chargeTriggered: false,
    })
  } else {
    gs.obstacles.push({
      id, kind, x: CANVAS_W + 20,
      y: GROUND_Y - MOUSE_H,
      w: MOUSE_W, h: MOUSE_H,
      hp: 1, speed: gs.speed * 0.85,
      alive: true, flash: 0,
      lastLaserTime: 0, isCharging: false, chargeTriggered: false,
    })
  }
}

export function shootLaser(gs: GameState) {
  const now = performance.now()
  if (now - gs.lastShot < SHOOT_COOLDOWN) return
  gs.lastShot = now
  const cannonY = gs.playerY + (gs.isDucking ? PLAYER_DUCK_H / 2 : PLAYER_H / 2)
  gs.lasers.push({ id: gs.nextId++, x: PLAYER_X + PLAYER_W, y: cannonY - LASER_H / 2 })
}

export function takeDamage(gs: GameState) {
  gs.lives--
  gs.invTimer = INVINCIBILITY_MS
  gs.shakeTimer = 250
  gs.hitStopTimer = 200
  for (let k = 0; k < 8; k++) {
    gs.particles.push({
      id: gs.nextId++,
      x: PLAYER_X + PLAYER_W / 2,
      y: gs.playerY + PLAYER_H / 2,
      vx: -150 + Math.random() * 300,
      vy: -150 + Math.random() * 300,
      life: 0.4,
      maxLife: 0.4,
      color: '#ef4444',
      size: 3 + Math.random() * 3,
    })
  }
}

// The main update function — pure logic, no rendering
export function updateGameState(gs: GameState, dt: number, input: GameInput): 'continue' | 'gameover' {
  // Hit-stop: freeze gameplay for 200ms on damage
  if (gs.hitStopTimer > 0) {
    gs.hitStopTimer -= dt * 1000
    return 'continue'
  }

  // Slow-motion effect for game-over
  if (gs.slowMotionTimer > 0) {
    gs.slowMotionTimer -= dt * 1000
    gs.slowMotionScale = 0.2
    if (gs.slowMotionTimer <= 0) {
      gs.slowMotionScale = 1
    }
  }
  const effectiveDt = dt * gs.slowMotionScale

  // ── Timing ────────────────────────────────────────────────────
  gs.elapsed += effectiveDt * 1000
  if (gs.invTimer > 0) gs.invTimer -= effectiveDt * 1000
  if (gs.shakeTimer > 0) gs.shakeTimer -= effectiveDt * 1000

  // ── Speed ramp ────────────────────────────────────────────────
  gs.speed = Math.min(SPEED_BASE + gs.elapsed * SPEED_RAMP, SPEED_MAX)

  // ── Jump input ────────────────────────────────────────────────
  if (input.jumpQueued && !gs.isJumping) {
    gs.velY = JUMP_VEL
    gs.isJumping = true
  }

  // ── Duck input ────────────────────────────────────────────────
  gs.isDucking = input.ducking

  // ── Shoot input ──────────────────────────────────────────────
  if (input.shootRequested) {
    shootLaser(gs)
  }

  // ── Player physics ────────────────────────────────────────────
  if (gs.isJumping) {
    gs.velY += GRAVITY * effectiveDt
    gs.playerY += gs.velY * effectiveDt
    if (gs.playerY >= GROUND_Y - PLAYER_H) {
      gs.playerY = GROUND_Y - PLAYER_H
      gs.velY = 0
      gs.isJumping = false
    }
  } else if (gs.isDucking) {
    gs.playerY = GROUND_Y - PLAYER_DUCK_H
  } else {
    gs.playerY = GROUND_Y - PLAYER_H
  }

  // ── Scroll ────────────────────────────────────────────────────
  gs.scrollOffset = (gs.scrollOffset + gs.speed * effectiveDt) % CANVAS_W
  gs.bgOffset = (gs.bgOffset + gs.speed * 0.15 * effectiveDt) % CANVAS_W

  // ── Spawn obstacles ───────────────────────────────────────────
  gs.spawnTimer -= effectiveDt * 1000
  if (gs.spawnTimer <= 0) {
    const gap = Math.max(SPAWN_MIN - gs.elapsed * 0.05, 500)
    gs.spawnTimer = gap + Math.random() * (SPAWN_MAX - SPAWN_MIN) * 0.5
    spawnObstacle(gs)
  }

  // ── Update obstacles ──────────────────────────────────────────
  for (let i = gs.obstacles.length - 1; i >= 0; i--) {
    const o = gs.obstacles[i]
    if (o.flash > 0) o.flash -= effectiveDt * 5

    // Mouse charge logic
    if (o.kind === 'mouse' && o.alive && !o.chargeTriggered) {
      if (o.x < CANVAS_W * MOUSE_WARNING_TRIGGER) {
        o.chargeTriggered = true
        o.isCharging = true
      }
    }
    if (o.kind === 'mouse' && o.isCharging) {
      o.x -= gs.speed * MOUSE_CHARGE_SPEED_MULT * effectiveDt
    } else {
      o.x -= gs.speed * effectiveDt
    }

    // Remove off-screen
    if (o.x + o.w < -20) { gs.obstacles.splice(i, 1); continue }

    // Bird hover
    if (o.kind === 'bird') {
      o.y = BIRD_Y_BASE + Math.sin(gs.elapsed * 0.003 + o.id * 2) * 15
    }

    // Player collision → damage, not instant death
    const ph = gs.isDucking ? PLAYER_DUCK_H : PLAYER_H
    if (gs.invTimer <= 0 && aabb(PLAYER_X, gs.playerY, PLAYER_W, ph, o.x, o.y, o.w, o.h)) {
      takeDamage(gs)
      if (gs.lives <= 0) {
        gs.phase = 'gameover'
        gs.shakeTimer = 300
        gs.slowMotionTimer = 600
        if (gs.score > gs.bestScore) {
          gs.bestScore = gs.score
          saveBest(gs.score)
        }
        return 'gameover'
      }
    }
  }

  // ── Bird laser firing ─────────────────────────────────────────
  for (const o of gs.obstacles) {
    if (o.kind === 'bird' && o.alive) {
      if (gs.elapsed - o.lastLaserTime > BIRD_LASER_INTERVAL) {
        o.lastLaserTime = gs.elapsed
        gs.enemyLasers.push({
          id: gs.nextId++,
          x: o.x,
          y: o.y + o.h / 2 - ENEMY_LASER_H / 2,
        })
      }
    }
  }

  // ── Update enemy lasers ───────────────────────────────────────
  for (let i = gs.enemyLasers.length - 1; i >= 0; i--) {
    const el = gs.enemyLasers[i]
    el.x -= ENEMY_LASER_SPEED * effectiveDt
    if (el.x < -20) { gs.enemyLasers.splice(i, 1); continue }

    const ph = gs.isDucking ? PLAYER_DUCK_H : PLAYER_H
    if (gs.invTimer <= 0 && aabb(PLAYER_X, gs.playerY, PLAYER_W, ph, el.x, el.y, ENEMY_LASER_W, ENEMY_LASER_H)) {
      gs.enemyLasers.splice(i, 1)
      takeDamage(gs)
      if (gs.lives <= 0) {
        gs.phase = 'gameover'
        gs.shakeTimer = 300
        gs.slowMotionTimer = 600
        if (gs.score > gs.bestScore) {
          gs.bestScore = gs.score
          saveBest(gs.score)
        }
        return 'gameover'
      }
    }
  }

  // ── Update lasers ─────────────────────────────────────────────
  for (let i = gs.lasers.length - 1; i >= 0; i--) {
    const l = gs.lasers[i]
    l.x += LASER_SPEED * effectiveDt
    if (l.x > CANVAS_W + 20) { gs.lasers.splice(i, 1); continue }

    for (let j = gs.obstacles.length - 1; j >= 0; j--) {
      const o = gs.obstacles[j]
      if (!o.alive) continue
      if (aabb(l.x, l.y, LASER_W, LASER_H, o.x, o.y, o.w, o.h)) {
        o.hp--
        o.flash = 1
        for (let k = 0; k < 6; k++) {
          gs.particles.push({
            id: gs.nextId++,
            x: l.x + LASER_W / 2,
            y: l.y + LASER_H / 2,
            vx: -100 + Math.random() * 200,
            vy: -100 + Math.random() * 200,
            life: 0.3,
            maxLife: 0.3,
            color: '#f472b6',
            size: 2 + Math.random() * 3,
          })
        }
        if (o.hp <= 0) {
          o.alive = false
          const bonus = o.kind === 'robot' ? DESTROY_ROBOT : o.kind === 'bird' ? DESTROY_BIRD : DESTROY_MOUSE
          gs.score += bonus
          // Floating score text
          gs.floatingTexts.push({
            x: o.x + o.w / 2,
            y: o.y - 10,
            text: `+${bonus}`,
            color: o.kind === 'bird' ? '#B98BFF' : o.kind === 'mouse' ? '#FF3B3B' : '#FF6FC4',
            life: 0.6,
            maxLife: 0.6,
          })
          for (let k = 0; k < 12; k++) {
            const angle = (k / 12) * Math.PI * 2
            gs.particles.push({
              id: gs.nextId++,
              x: o.x + o.w / 2,
              y: o.y + o.h / 2,
              vx: Math.cos(angle) * (80 + Math.random() * 120),
              vy: Math.sin(angle) * (80 + Math.random() * 120),
              life: 0.4,
              maxLife: 0.4,
              color: o.kind === 'bird' ? '#B98BFF' : o.kind === 'mouse' ? '#FF3B3B' : '#FF6FC4',
              size: 3 + Math.random() * 4,
            })
          }
          gs.obstacles.splice(j, 1)
        }
        gs.lasers.splice(i, 1)
        break
      }
    }
  }

  // ── Update particles ──────────────────────────────────────────
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const p = gs.particles[i]
    p.x += p.vx * effectiveDt
    p.y += p.vy * effectiveDt
    p.life -= effectiveDt
    if (p.life <= 0) gs.particles.splice(i, 1)
  }

  // ── Update floating texts ─────────────────────────────────────
  for (let i = gs.floatingTexts.length - 1; i >= 0; i--) {
    const ft = gs.floatingTexts[i]
    ft.y -= 40 * effectiveDt
    ft.life -= effectiveDt
    if (ft.life <= 0) gs.floatingTexts.splice(i, 1)
  }

  return 'continue'
}
