# MIU-9 PixiJS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the MIU-9 Future Run mini-game from Canvas 2D to PixiJS rendering while preserving all existing gameplay logic, and add pause, state machine, parallax city, visual juice, and loading state.

**Architecture:** Incremental migration — extract pure game update logic from the render-bound game loop, create a PixiJS renderer that consumes the same GameState, and wire them together. Canvas 2D is fully replaced. Store3D integration (modal, session, rewards, mobile controls) is untouched.

**Tech Stack:** PixiJS 8.x, React 19, TypeScript 5.9, Vite 8, Tailwind 4

**Spec:** `.ai/CANONICAL_CONTEXT.md` + user-provided v4 specification (68 sections)

## Global Constraints

- PixiJS v8 for rendering (NOT Three.js, NOT heavy physics)
- Preserve existing: scoring, collision, lives, Gemini fallback, admin test, reward flow
- No new backend endpoints
- No exposing GEMINI_API_KEY
- No standalone HTML game
- Max 2 simultaneous GlowFilter instances
- Particle pool max 80
- 60 FPS desktop, 30 FPS mobile minimum
- TypeScript 0 errors, Build passes
- No commit/push without explicit instruction

## File Structure

| File | Purpose | Action |
|------|---------|--------|
| `client/src/components/mini-game/miu9-future-run.tsx` | Main game — rewrite with PixiJS | **Modify** |
| `client/src/components/mini-game/pixi-renderer.ts` | PixiJS renderer class | **Create** |
| `client/src/components/mini-game/game-state.ts` | Pure game update logic (extracted) | **Create** |
| `client/src/components/mini-game/game-assets.ts` | Asset loading, cache, fallback sprites | **Create** |
| `client/src/components/mini-game/particle-pool.ts` | Pooled particle system | **Create** |
| `client/src/components/mini-game/parallax-city.ts` | City background layers | **Create** |
| `client/src/components/mini-game/visual-juice.ts` | Effects: shake, flash, vignette, floating text | **Create** |
| `client/src/components/mini-game/mobile-controls.tsx` | Touch controls — keep as-is | **Keep** |
| `client/src/components/mini-game/mini-game-modal.tsx` | Dialog wrapper — keep as-is | **Keep** |
| `client/src/components/mini-game/reward-coupon-card.tsx` | Coupon display — keep as-is | **Keep** |
| `client/package.json` | Add pixi.js dependency | **Modify** |

---

## Task 1: Install PixiJS Dependency

**Files:**
- Modify: `client/package.json`

**Interfaces:**
- Produces: `pixi.js` available as import in client code

- [ ] **Step 1: Install pixi.js**

Run from `client/`:
```bash
npm install pixi.js
```

- [ ] **Step 2: Verify installation**

Run from `client/`:
```bash
npx tsc --noEmit
```
Expected: 0 errors (pixi.js types should resolve)

- [ ] **Step 3: Verify build**

Run from `client/`:
```bash
npm run build
```
Expected: Build succeeds

---

## Task 2: Extract Pure Game Update Logic

**Files:**
- Create: `client/src/components/mini-game/game-state.ts`
- Modify: `client/src/components/mini-game/miu9-future-run.tsx` (temporarily — will be fully rewritten later)

**Interfaces:**
- Consumes: All constants, types, interfaces from miu9-future-run.tsx (lines 1-188)
- Produces: `updateGameState(gs: GameState, dt: number, input: GameInput): GameState` — pure function, no rendering

**Key principle:** The update function mutates GameState in-place (for performance) but makes zero rendering calls. This separates gameplay from visuals.

- [ ] **Step 1: Create `game-state.ts` with types and constants**

```typescript
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
export const LASER_W = 32
export const LASER_H = 6
export const SHOOT_COOLDOWN = 300

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
export const BEST_KEY = 'store3d_miu9_best'

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
      lastLaserTime: performance.now(), isCharging: false, chargeTriggered: false,
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
  gs.shakeTimer = 200
  for (let k = 0; k < 8; k++) {
    gs.particles.push({
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
  const currentTime = performance.now()
  for (const o of gs.obstacles) {
    if (o.kind === 'bird' && o.alive) {
      if (currentTime - o.lastLaserTime > BIRD_LASER_INTERVAL) {
        o.lastLaserTime = currentTime
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
```

- [ ] **Step 2: Verify game-state.ts compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: 0 errors

---

## Task 3: Create Particle Pool

**Files:**
- Create: `client/src/components/mini-game/particle-pool.ts`

**Interfaces:**
- Consumes: `Particle` type from game-state.ts
- Produces: `ParticlePool` class — manages PIXI.Graphics objects for particles

- [ ] **Step 1: Create particle-pool.ts**

```typescript
// client/src/components/mini-game/particle-pool.ts
import * as PIXI from 'pixi.js'

const MAX_PARTICLES = 80

export class ParticlePool {
  private pool: PIXI.Graphics[] = []
  private active: Set<PIXI.Graphics> = new Set()
  private container: PIXI.Container

  constructor(container: PIXI.Container) {
    this.container = container
    // Pre-allocate pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const g = new PIXI.Graphics()
      g.visible = false
      container.addChild(g)
      this.pool.push(g)
    }
  }

  spawn(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number) {
    const g = this.pool.pop()
    if (!g) return // pool exhausted
    g.clear()
    g.circle(0, 0, size)
    g.fill(color)
    g.x = x
    g.y = y
    g.alpha = 1
    g.visible = true
    this.active.add(g)
    // Store metadata on the graphics object
    ;(g as any)._vx = vx
    ;(g as any)._vy = vy
    ;(g as any)._life = life
    ;(g as any)._maxLife = life
    ;(g as any)._size = size
  }

  update(dt: number) {
    for (const g of this.active) {
      const vx = (g as any)._vx
      const vy = (g as any)._vy
      g.x += vx * dt
      g.y += vy * dt
      ;(g as any)._life -= dt
      const lifeRatio = Math.max(0, (g as any)._life / (g as any)._maxLife)
      g.alpha = lifeRatio
      g.scale.set(lifeRatio)
      if ((g as any)._life <= 0) {
        g.visible = false
        this.active.delete(g)
        this.pool.push(g)
      }
    }
  }

  clear() {
    for (const g of this.active) {
      g.visible = false
      this.pool.push(g)
    }
    this.active.clear()
  }
}
```

- [ ] **Step 2: Verify particle-pool.ts compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: 0 errors

---

## Task 4: Create Asset Manager with Fallback Sprites

**Files:**
- Create: `client/src/components/mini-game/game-assets.ts`

**Interfaces:**
- Consumes: `getGameAsset()` from `@/services/gameAssetApi`
- Produces: `GameAssets` class — loads Gemini images, creates PIXI.Texture fallbacks, provides textures for renderer

- [ ] **Step 1: Create game-assets.ts**

```typescript
// client/src/components/mini-game/game-assets.ts
import * as PIXI from 'pixi.js'
import { getGameAsset } from '@/services/gameAssetApi'

type AssetType = 'background' | 'road' | 'player' | 'bird-robot' | 'mouse-robot'

// Design token colors
const PINK = 0xFF6FC4
const CYAN = 0x4DE8FF
const PURPLE = 0xB98BFF
const RED = 0xFF3B3B
const NAVY = 0x0A0E1F
const NAVY2 = 0x131A33

export class GameAssets {
  private textures: Map<string, PIXI.Texture> = new Map()
  private loaded = false

  async load(onProgress?: (loaded: number, total: number) => void) {
    if (this.loaded) return
    const types: AssetType[] = ['player', 'bird-robot', 'mouse-robot', 'background', 'road']
    let loaded = 0

    const results = await Promise.allSettled(
      types.map(async (type) => {
        try {
          const dataUrl = await getGameAsset(type)
          if (dataUrl) {
            const tex = await PIXI.Assets.load(dataUrl)
            this.textures.set(type, tex)
          }
        } catch {
          // fallback to generated sprites
        }
        loaded++
        onProgress?.(loaded, types.length)
      })
    )

    // Generate fallback textures for any that failed
    for (const type of types) {
      if (!this.textures.has(type)) {
        this.textures.set(type, this.generateFallback(type))
      }
    }
    this.loaded = true
  }

  getTexture(type: AssetType): PIXI.Texture {
    return this.textures.get(type) || this.generateFallback(type)
  }

  private generateFallback(type: AssetType): PIXI.Texture {
    const g = new PIXI.Graphics()
    switch (type) {
      case 'player':
        // Cute pink cyber cat
        g.roundRect(0, 0, 48, 52, 10).fill(PINK)
        g.roundRect(9, 0, 30, 18, 4).fill(PINK) // head
        g.roundRect(16, 3, 16, 7, 3).fill(0x0f172a) // visor
        g.circle(20, 7, 3).fill(CYAN) // left eye
        g.circle(32, 7, 3).fill(CYAN) // right eye
        g.circle(24, 23, 5).fill(0x0f172a) // core
        g.circle(24, 23, 3).fill(CYAN) // core glow
        g.roundRect(46, 16, 10, 6, 2).fill(0x1e293b) // cannon
        g.circle(56, 19, 3).fill(CYAN) // cannon glow
        break
      case 'bird-robot':
        g.ellipse(26, 20, 26, 20).fill(PURPLE)
        g.circle(26, 20, 6).fill(0x0f172a) // eye bg
        g.circle(26, 20, 4).fill(RED) // eye
        break
      case 'mouse-robot':
        g.roundRect(2, 10, 44, 34, 5).fill(RED) // body
        g.roundRect(6, 0, 36, 16, 4).fill(RED) // head
        g.circle(8, 2, 5).fill(RED) // ear
        g.circle(40, 2, 5).fill(RED) // ear
        g.fillRect(12, 5, 5, 5).fill(0xffffff) // eye
        g.fillRect(31, 5, 5, 5).fill(0xffffff) // eye
        // sword
        g.moveTo(46, 16).lineTo(62, 12).lineTo(64, 14).lineTo(48, 18).closePath().fill(0xd1d5db)
        break
      case 'background':
        g.rect(0, 0, 1280, 720).fill(NAVY)
        break
      case 'road':
        g.rect(0, 0, 1280, 110).fill(NAVY2)
        break
    }
    const texture = PIXI.renderer.generateTexture(g)
    g.destroy()
    return texture
  }

  clear() {
    this.textures.clear()
    this.loaded = false
  }
}
```

- [ ] **Step 2: Verify game-assets.ts compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: 0 errors

---

## Task 5: Create Parallax City Background

**Files:**
- Create: `client/src/components/mini-game/parallax-city.ts`

**Interfaces:**
- Consumes: `GameAssets` textures, `GameState.bgOffset`/`scrollOffset`
- Produces: `ParallaxCity` class — manages layered PIXI.Graphics containers for city background

- [ ] **Step 1: Create parallax-city.ts**

```typescript
// client/src/components/mini-game/parallax-city.ts
import * as PIXI from 'pixi.js'
import { CANVAS_W, CANVAS_H, GROUND_Y } from './game-state'

// Design tokens
const NAVY1 = 0x0A0E1F
const NAVY2 = 0x131A33
const PINK = 0xFF6FC4
const CYAN = 0x4DE8FF
const PURPLE = 0xB98BFF

export class ParallaxCity {
  skyLayer: PIXI.Container
  distantLayer: PIXI.Container
  midLayer: PIXI.Container
  streetLayer: PIXI.Container
  roadLayer: PIXI.Container

  private skyGfx: PIXI.Graphics
  private distantBuildings: PIXI.Graphics[] = []
  private midBuildings: PIXI.Graphics[] = []
  private streetObjects: PIXI.Graphics[] = []

  constructor() {
    this.skyLayer = new PIXI.Container()
    this.distantLayer = new PIXI.Container()
    this.midLayer = new PIXI.Container()
    this.streetLayer = new PIXI.Container()
    this.roadLayer = new PIXI.Container()

    this.skyGfx = this.createSky()
    this.skyLayer.addChild(this.skyGfx)

    this.createDistantBuildings()
    this.createMidBuildings()
    this.createStreetObjects()
    this.createRoad()
  }

  private createSky(): PIXI.Graphics {
    const g = new PIXI.Graphics()
    // Gradient sky (dark navy to purple)
    g.rect(0, 0, CANVAS_W, GROUND_Y).fill(NAVY1)
    // Horizon glow
    g.rect(0, GROUND_Y - 80, CANVAS_W, 80).fill({ color: CYAN, alpha: 0.04 })
    // Stars
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5) % CANVAS_W
      const sy = (i * 73.1) % (GROUND_Y - 40)
      g.circle(sx, sy, 1).fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.3 })
    }
    return g
  }

  private createDistantBuildings() {
    const g = new PIXI.Graphics()
    // Distant skyline — small silhouettes
    for (let i = 0; i < 20; i++) {
      const x = i * 80
      const h = 60 + Math.random() * 120
      const w = 30 + Math.random() * 40
      g.rect(x, GROUND_Y - h, w, h).fill({ color: 0x1a1f3a, alpha: 0.6 })
      // Neon window dots
      for (let wy = GROUND_Y - h + 10; wy < GROUND_Y - 10; wy += 12) {
        for (let wx = x + 5; wx < x + w - 5; wx += 8) {
          if (Math.random() > 0.6) {
            const c = Math.random() > 0.5 ? PINK : CYAN
            g.circle(wx, wy, 1).fill({ color: c, alpha: 0.3 })
          }
        }
      }
    }
    g.x = 0
    this.distantBuildings.push(g)
    this.distantLayer.addChild(g)
  }

  private createMidBuildings() {
    const g = new PIXI.Graphics()
    // Mid-height buildings
    for (let i = 0; i < 14; i++) {
      const x = i * 100
      const h = 120 + Math.random() * 200
      const w = 50 + Math.random() * 50
      g.roundRect(x, GROUND_Y - h, w, h, 3).fill(NAVY2)
      // Neon signs
      if (Math.random() > 0.5) {
        const signColor = Math.random() > 0.5 ? PINK : PURPLE
        g.roundRect(x + 10, GROUND_Y - h + 20, w - 20, 12, 2).fill({ color: signColor, alpha: 0.4 })
      }
      // Windows
      for (let wy = GROUND_Y - h + 40; wy < GROUND_Y - 10; wy += 16) {
        for (let wx = x + 8; wx < x + w - 8; wx += 12) {
          if (Math.random() > 0.4) {
            g.rect(wx, wy, 6, 8).fill({ color: CYAN, alpha: 0.15 })
          }
        }
      }
    }
    this.midBuildings.push(g)
    this.midLayer.addChild(g)
  }

  private createStreetObjects() {
    const g = new PIXI.Graphics()
    // Street lamps, signs, etc.
    for (let i = 0; i < 12; i++) {
      const x = i * 120
      // Lamp post
      g.rect(x, GROUND_Y - 60, 3, 60).fill({ color: 0x334155, alpha: 0.5 })
      g.circle(x + 1.5, GROUND_Y - 60, 5).fill({ color: CYAN, alpha: 0.3 })
    }
    this.streetObjects.push(g)
    this.streetLayer.addChild(g)
  }

  private createRoad() {
    const g = new PIXI.Graphics()
    // Road surface
    g.rect(0, 0, CANVAS_W, CANVAS_H - GROUND_Y).fill(NAVY2)
    // Neon edge
    g.rect(0, 0, CANVAS_W, 2).fill({ color: CYAN, alpha: 0.6 })
    // Lane markings (scrolling)
    for (let i = 0; i < 20; i++) {
      const lx = i * 70
      g.rect(lx, 30, 30, 2).fill({ color: CYAN, alpha: 0.15 })
    }
    this.roadLayer.addChild(g)
  }

  update(bgOffset: number, scrollOffset: number) {
    // Distant: slow parallax
    this.distantLayer.x = -(bgOffset * 0.3) % CANVAS_W
    // Mid: medium parallax
    this.midLayer.x = -(bgOffset * 0.6) % CANVAS_W
    // Street: fast parallax
    this.streetLayer.x = -(bgOffset * 1.0) % CANVAS_W
    // Road: fastest
    this.roadLayer.x = -(scrollOffset * 0.5) % CANVAS_W
  }
}
```

- [ ] **Step 2: Verify parallax-city.ts compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: 0 errors

---

## Task 6: Create PixiJS Renderer

**Files:**
- Create: `client/src/components/mini-game/pixi-renderer.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAssets`, `ParallaxCity`, `ParticlePool`
- Produces: `PixiRenderer` class — manages PIXI.Application, all sprite rendering, updates visual state from GameState

- [ ] **Step 1: Create pixi-renderer.ts**

This is the core renderer. It creates a PIXI.Application, manages sprite pools for enemies/lasers, and syncs visuals with GameState every frame.

```typescript
// client/src/components/mini-game/pixi-renderer.ts
import * as PIXI from 'pixi.js'
import { GlowFilter } from 'pixi-filters/glow'
import {
  GameState, CANVAS_W, CANVAS_H, GROUND_Y,
  PLAYER_X, PLAYER_W, PLAYER_H, PLAYER_DUCK_H,
  LASER_W, LASER_H, ENEMY_LASER_W, ENEMY_LASER_H,
} from './game-state'
import { GameAssets } from './game-assets'
import { ParallaxCity } from './parallax-city'
import { ParticlePool } from './particle-pool'

// Object pools for enemies and lasers
interface EnemySprite {
  kind: 'robot' | 'bird' | 'mouse'
  gfx: PIXI.Graphics
  id: number
}

interface LaserSprite {
  type: 'player' | 'enemy'
  gfx: PIXI.Graphics
  id: number
}

export class PixiRenderer {
  app: PIXI.Application
  private assets: GameAssets
  private city: ParallaxCity
  private particles: ParticlePool

  // Containers (z-order)
  private bgContainer = new PIXI.Container()
  private roadContainer = new PIXI.Container()
  private enemyContainer = new PIXI.Container()
  private playerContainer = new PIXI.Container()
  private laserContainer = new PIXI.Container()
  private particleContainer = new PIXI.Container()
  private uiContainer = new PIXI.Container()

  // Player sprite
  private playerGfx = new PIXI.Graphics()
  private playerGlow: GlowFilter

  // Enemy pools
  private enemySprites: EnemySprite[] = []
  private laserSprites: LaserSprite[] = []

  // Floating text pool
  private floatingTexts: PIXI.Text[] = []

  // Vignette overlay for damage/game-over
  private vignette = new PIXI.Graphics()

  // Screen shake
  private shakeContainer = new PIXI.Container()

  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application()
    this.assets = new GameAssets()
    this.city = new ParallaxCity()
    this.particles = new ParticlePool(this.particleContainer)

    // Initialize PixiJS asynchronously
    // (caller must await init())
  }

  async init(canvas: HTMLCanvasElement) {
    await this.app.init({
      canvas,
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    // Build layer hierarchy
    this.shakeContainer.addChild(this.bgContainer)
    this.shakeContainer.addChild(this.roadContainer)
    this.shakeContainer.addChild(this.enemyContainer)
    this.shakeContainer.addChild(this.playerContainer)
    this.shakeContainer.addChild(this.laserContainer)
    this.shakeContainer.addChild(this.particleContainer)
    this.shakeContainer.addChild(this.uiContainer)
    this.app.stage.addChild(this.shakeContainer)

    // City background
    this.bgContainer.addChild(this.city.skyLayer)
    this.bgContainer.addChild(this.city.distantLayer)
    this.bgContainer.addChild(this.city.midLayer)
    this.bgContainer.addChild(this.city.streetLayer)
    this.roadContainer.addChild(this.city.roadLayer)

    // Player
    this.playerGlow = new GlowFilter({ distance: 15, outerStrength: 2, color: 0xFF6FC4 })
    this.playerContainer.addChild(this.playerGfx)

    // Vignette
    this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000000, alpha: 0 })
    this.uiContainer.addChild(this.vignette)

    // Load assets
    await this.assets.load()
  }

  update(gs: GameState) {
    // ── Screen shake ────────────────────────────────────────────
    if (gs.shakeTimer > 0) {
      const intensity = gs.shakeTimer / 300 * 6
      this.shakeContainer.x = (Math.random() - 0.5) * intensity
      this.shakeContainer.y = (Math.random() - 0.5) * intensity
    } else {
      this.shakeContainer.x = 0
      this.shakeContainer.y = 0
    }

    // ── Parallax ────────────────────────────────────────────────
    this.city.update(gs.bgOffset, gs.scrollOffset)

    // ── Player ──────────────────────────────────────────────────
    this.renderPlayer(gs)

    // ── Enemies ─────────────────────────────────────────────────
    this.syncEnemies(gs)

    // ── Lasers ──────────────────────────────────────────────────
    this.syncLasers(gs)

    // ── Enemy Lasers ────────────────────────────────────────────
    this.syncEnemyLasers(gs)

    // ── Particles ───────────────────────────────────────────────
    this.syncParticles(gs)

    // ── Floating Texts ──────────────────────────────────────────
    this.syncFloatingTexts(gs)

    // ── Vignette (damage flash) ─────────────────────────────────
    if (gs.invTimer > 0 && gs.invTimer > INVINCIBILITY_MS - 200) {
      this.vignette.clear()
      this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0xff0000, alpha: 0.15 })
    } else if (gs.phase === 'gameover') {
      this.vignette.clear()
      this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000000, alpha: 0.5 })
    } else {
      this.vignette.clear()
    }
  }

  private renderPlayer(gs: GameState) {
    const g = this.playerGfx
    g.clear()

    const ph = gs.isDucking ? PLAYER_DUCK_H : PLAYER_H
    const py = gs.playerY
    const px = PLAYER_X

    // Invincibility flash
    if (gs.invTimer > 0 && Math.floor(gs.invTimer / 50) % 2 === 0) {
      g.alpha = 0.3
    } else {
      g.alpha = 1
    }

    // Body
    g.roundRect(px + 4, py + (gs.isDucking ? 2 : 10), PLAYER_W - 8, ph - (gs.isDucking ? 4 : 14), 10)
      .fill(0xFF6FC4)

    // Head
    const headY = gs.isDucking ? py : py - 2
    g.ellipse(px + PLAYER_W / 2, headY + 9, 14, 11).fill(0xFF6FC4)

    // Ears
    g.moveTo(px + 8, headY + 4).lineTo(px + 5, headY - 8).lineTo(px + 16, headY + 2).closePath().fill(0xFF6FC4)
    g.moveTo(px + PLAYER_W - 8, headY + 4).lineTo(px + PLAYER_W - 5, headY - 8).lineTo(px + PLAYER_W - 16, headY + 2).closePath().fill(0xFF6FC4)

    // Inner ears
    g.moveTo(px + 9, headY + 3).lineTo(px + 7, headY - 5).lineTo(px + 14, headY + 2).closePath().fill(0xF9A8D4)
    g.moveTo(px + PLAYER_W - 9, headY + 3).lineTo(px + PLAYER_W - 7, headY - 5).lineTo(px + PLAYER_W - 14, headY + 2).closePath().fill(0xF9A8D4)

    // Visor
    g.roundRect(px + 9, headY + 5, PLAYER_W - 18, 7, 3).fill(0x0f172a)

    // Eyes
    g.circle(px + 16, headY + 9, 3.5).fill(0x4DE8FF)
    g.circle(px + PLAYER_W - 16, headY + 9, 3.5).fill(0x4DE8FF)

    // Eye cores
    g.circle(px + 16, headY + 9, 1.2).fill(0xecfeff)
    g.circle(px + PLAYER_W - 16, headY + 9, 1.2).fill(0xecfeff)

    // Nose
    g.moveTo(px + PLAYER_W / 2 - 2, headY + 13).lineTo(px + PLAYER_W / 2, headY + 15).lineTo(px + PLAYER_W / 2 + 2, headY + 13).closePath().fill(0x9d174d)

    // Arm cannon
    g.roundRect(px + PLAYER_W - 2, py + 16, 10, 6, 2).fill(0x1e293b)
    g.circle(px + PLAYER_W + 8, py + 19, 3).fill(0x4DE8FF)

    // Chest core
    g.circle(px + PLAYER_W / 2, py + ph * 0.45, 5).fill(0x0f172a)
    g.circle(px + PLAYER_W / 2, py + ph * 0.45, 3).fill(0x4DE8FF)

    // Tail
    g.moveTo(px + 4, py + ph * 0.4)
      .quadraticCurveTo(px - 8, py + ph * 0.2, px - 4, py + ph * 0.1)
      .stroke({ width: 2.5, color: 0xFF6FC4 })

    // Armor lines
    for (let i = 0; i < 3; i++) {
      const ly = py + 16 + i * 6
      if (ly < py + ph - 6) {
        g.moveTo(px + 10, ly).lineTo(px + PLAYER_W - 10, ly).stroke({ width: 0.8, color: 0xf9a8d4, alpha: 0.3 })
      }
    }
  }

  private syncEnemies(gs: GameState) {
    // Remove sprites for dead/despawned enemies
    for (let i = this.enemySprites.length - 1; i >= 0; i--) {
      const es = this.enemySprites[i]
      if (!gs.obstacles.find(o => o.id === es.id)) {
        this.enemyContainer.removeChild(es.gfx)
        es.gfx.destroy()
        this.enemySprites.splice(i, 1)
      }
    }

    // Update or create sprites
    for (const o of gs.obstacles) {
      let es = this.enemySprites.find(s => s.id === o.id)
      if (!es) {
        es = { kind: o.kind, gfx: new PIXI.Graphics(), id: o.id }
        this.enemyContainer.addChild(es.gfx)
        this.enemySprites.push(es)
      }
      this.drawEnemy(es, o, gs.elapsed)
    }
  }

  private drawEnemy(es: EnemySprite, o: { x: number; y: number; w: number; h: number; flash: number; isCharging: boolean; chargeTriggered: boolean }, elapsed: number) {
    const g = es.gfx
    g.clear()

    if (o.flash > 0) g.alpha = 0.6 + o.flash * 0.4
    else g.alpha = 1

    if (es.kind === 'robot') {
      // Body
      g.roundRect(o.x + 2, o.y + 10, o.w - 4, o.h - 14, 5)
        .fill(0xf97316)
      // Head
      g.roundRect(o.x + 6, o.y, o.w - 12, 16, 4).fill(0xf97316)
      // Eyes
      g.rect(o.x + 10, o.y + 5, 6, 5).fill(0xfbbf24)
      g.rect(o.x + o.w - 16, o.y + 5, 6, 5).fill(0xfbbf24)
      // Arm cannon
      g.roundRect(o.x - 6, o.y + 18, 10, 5, 2).fill(0x9a3412)
      g.circle(o.x - 6, o.y + 20.5, 2.5).fill(0xfbbf24)
      // Legs
      g.rect(o.x + 8, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      g.rect(o.x + o.w - 14, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
    } else if (es.kind === 'bird') {
      const hover = Math.sin(elapsed * 0.005) * 3
      // Wings
      g.moveTo(o.x + 8, o.y + o.h / 2 + hover)
        .lineTo(o.x - 4, o.y + 4 + hover)
        .lineTo(o.x + 16, o.y + o.h / 2 + hover)
        .closePath().fill(0x7c3aed)
      g.moveTo(o.x + o.w - 8, o.y + o.h / 2 + hover)
        .lineTo(o.x + o.w + 4, o.y + 4 + hover)
        .lineTo(o.x + o.w - 16, o.y + o.h / 2 + hover)
        .closePath().fill(0x7c3aed)
      // Fuselage
      g.ellipse(o.x + o.w / 2, o.y + o.h / 2 + hover, o.w / 2, o.h / 2)
        .fill(0xa855f7)
      // Eye
      g.circle(o.x + o.w / 2, o.y + o.h / 2 + hover, 6).fill(0x0f172a)
      g.circle(o.x + o.w / 2, o.y + o.h / 2 + hover, 4).fill(0xef4444)
      g.circle(o.x + o.w / 2, o.y + o.h / 2 + hover, 1.5).fill(0xfca5a5)
    } else if (es.kind === 'mouse') {
      const bodyColor = o.isCharging ? 0xdc2626 : 0xef4444
      // Body
      g.roundRect(o.x + 2, o.y + 10, o.w - 4, o.h - 14, 5).fill(bodyColor)
      // Head
      g.roundRect(o.x + 6, o.y, o.w - 12, 16, 4).fill(bodyColor)
      // Ears
      g.circle(o.x + 8, o.y + 2, 5).fill(bodyColor)
      g.circle(o.x + o.w - 8, o.y + 2, 5).fill(bodyColor)
      g.circle(o.x + 8, o.y + 2, 3).fill(0xfca5a5)
      g.circle(o.x + o.w - 8, o.y + 2, 3).fill(0xfca5a5)
      // Eyes
      g.rect(o.x + 12, o.y + 5, 5, 5).fill(o.chargeTriggered ? 0xfbbf24 : 0xffffff)
      g.rect(o.x + o.w - 17, o.y + 5, 5, 5).fill(o.chargeTriggered ? 0xfbbf24 : 0xffffff)
      // Nose
      g.circle(o.x + o.w / 2, o.y + 12, 2).fill(0x1e293b)
      // Sword
      g.moveTo(o.x + o.w - 2, o.y + 16)
        .lineTo(o.x + o.w + 14, o.y + 12)
        .lineTo(o.x + o.w + 16, o.y + 14)
        .lineTo(o.x + o.w + 2, o.y + 18)
        .closePath().fill(0xd1d5db)
      // Legs
      const legOff = o.isCharging ? 4 : 0
      g.rect(o.x + 8 - legOff, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      g.rect(o.x + o.w - 14 + legOff, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      // Charge speed lines
      if (o.isCharging) {
        for (let i = 0; i < 3; i++) {
          const ly = o.y + 10 + i * 12
          g.moveTo(o.x - 10 - i * 5, ly).lineTo(o.x - 20 - i * 8, ly)
            .stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.5 })
        }
      }
      // Warning "!" for charge
      if (o.chargeTriggered && !o.isCharging) {
        g.circle(o.x + o.w / 2, o.y - 16, 12).fill({ color: 0xfbbf24, alpha: 0.3 })
      }
    }
  }

  private syncLasers(gs: GameState) {
    // Remove old
    for (let i = this.laserSprites.length - 1; i >= 0; i--) {
      const ls = this.laserSprites[i]
      if (ls.type === 'player' && !gs.lasers.find(l => l.id === ls.id)) {
        this.laserContainer.removeChild(ls.gfx)
        ls.gfx.destroy()
        this.laserSprites.splice(i, 1)
      }
    }
    // Create/update
    for (const l of gs.lasers) {
      let ls = this.laserSprites.find(s => s.type === 'player' && s.id === l.id)
      if (!ls) {
        ls = { type: 'player', gfx: new PIXI.Graphics(), id: l.id }
        this.laserContainer.addChild(ls.gfx)
        this.laserSprites.push(ls)
      }
      ls.gfx.clear()
      ls.gfx.rect(0, 0, LASER_W, LASER_H).fill(0x4DE8FF)
      ls.gfx.rect(4, 1, LASER_W - 8, LASER_H - 2).fill(0xecfeff)
      ls.gfx.x = l.x
      ls.gfx.y = l.y
    }
  }

  private syncEnemyLasers(gs: GameState) {
    for (let i = this.laserSprites.length - 1; i >= 0; i--) {
      const ls = this.laserSprites[i]
      if (ls.type === 'enemy' && !gs.enemyLasers.find(l => l.id === ls.id)) {
        this.laserContainer.removeChild(ls.gfx)
        ls.gfx.destroy()
        this.laserSprites.splice(i, 1)
      }
    }
    for (const el of gs.enemyLasers) {
      let ls = this.laserSprites.find(s => s.type === 'enemy' && s.id === el.id)
      if (!ls) {
        ls = { type: 'enemy', gfx: new PIXI.Graphics(), id: el.id }
        this.laserContainer.addChild(ls.gfx)
        this.laserSprites.push(ls)
      }
      ls.gfx.clear()
      ls.gfx.rect(0, 0, ENEMY_LASER_W, ENEMY_LASER_H).fill(0xef4444)
      ls.gfx.rect(3, 1, ENEMY_LASER_W - 6, ENEMY_LASER_H - 2).fill(0xfca5a5)
      ls.gfx.x = el.x
      ls.gfx.y = el.y
    }
  }

  private syncParticles(gs: GameState) {
    // Spawn new particles from GameState
    for (const p of gs.particles) {
      // Check if already spawned (simple: just spawn, pool handles dedup)
      this.particles.spawn(p.x, p.y, p.vx, p.vy, p.life, p.color, p.size)
    }
    this.particles.update(1 / 60) // approximate dt
  }

  private syncFloatingTexts(gs: GameState) {
    // Sync floating text pool
    // Remove old
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i]
      if (!gs.floatingTexts.find(f => f.text === (ft as any)._text && Math.abs(f.x - ft.x) < 5)) {
        this.uiContainer.removeChild(ft)
        ft.destroy()
        this.floatingTexts.splice(i, 1)
      }
    }
    // Create new
    for (const ft of gs.floatingTexts) {
      let text = this.floatingTexts.find(t => (t as any)._text === ft.text && Math.abs(t.x - ft.x) < 5)
      if (!text) {
        text = new PIXI.Text({
          text: ft.text,
          style: {
            fontFamily: 'Orbitron, monospace',
            fontSize: 18,
            fill: ft.color,
            fontWeight: 'bold',
          }
        })
        ;(text as any)._text = ft.text
        this.uiContainer.addChild(text)
        this.floatingTexts.push(text)
      }
      text.x = ft.x
      text.y = ft.y
      text.alpha = ft.life / ft.maxLife
    }
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
  }

  destroy() {
    this.app.destroy(true)
  }
}

// Re-export INVINCIBILITY_MS for vignette use
import { INVINCIBILITY_MS } from './game-state'
```

- [ ] **Step 2: Install pixi-filters**

Run from `client/`:
```bash
npm install pixi-filters
```

- [ ] **Step 3: Verify pixi-renderer.ts compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```
Expected: 0 errors (may need to adjust types — pixi-filters exports vary by version)

---

## Task 7: Create Visual Juice Module

**Files:**
- Create: `client/src/components/mini-game/visual-juice.ts`

**Interfaces:**
- Consumes: `GameState`, PixiJS renderer components
- Produces: `VisualJuice` class — manages screen shake, vignettes, jump effects, damage effects

- [ ] **Step 1: Create visual-juice.ts**

```typescript
// client/src/components/mini-game/visual-juice.ts
import * as PIXI from 'pixi.js'
import { GameState, CANVAS_W, CANVAS_H } from './game-state'

export class VisualJuice {
  private redVignette: PIXI.Graphics
  private darkVignette: PIXI.Graphics

  constructor(container: PIXI.Container) {
    this.redVignette = new PIXI.Graphics()
    this.redVignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0xff0000, alpha: 0 })
    container.addChild(this.redVignette)

    this.darkVignette = new PIXI.Graphics()
    this.darkVignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000000, alpha: 0 })
    container.addChild(this.darkVignette)
  }

  update(gs: GameState) {
    // Red vignette on damage
    if (gs.invTimer > 0 && gs.invTimer > 1800) {
      this.redVignette.clear()
      this.redVignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0xff0000, alpha: 0.12 })
    } else {
      this.redVignette.clear()
    }

    // Dark vignette for game-over slow-mo
    if (gs.slowMotionTimer > 0) {
      this.darkVignette.clear()
      const alpha = Math.min(0.5, (600 - gs.slowMotionTimer) / 600 * 0.5)
      this.darkVignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000000, alpha })
    } else {
      this.darkVignette.clear()
    }
  }
}
```

- [ ] **Step 2: Verify compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```

---

## Task 8: Rewrite Main Game Component with PixiJS

**Files:**
- Modify: `client/src/components/mini-game/miu9-future-run.tsx`

**Interfaces:**
- Consumes: `PixiRenderer`, `GameState`, `GameAssets`, `updateGameState`, `createInitialState`
- Produces: Complete game component with LOADING → MENU → PLAYING → PAUSED → GAME_OVER state machine

This is the main integration task. The entire component is rewritten to use PixiJS renderer instead of Canvas 2D, with proper state machine.

- [ ] **Step 1: Rewrite miu9-future-run.tsx**

Key changes:
- Replace `canvasRef` with PixiJS canvas
- Add explicit state machine with `loading | menu | playing | paused | gameover`
- Add pause on ESC / window blur
- Add loading state with progress
- Game loop: call `updateGameState()` then `renderer.update(gs)`
- Keep all Store3D integration (onGameEnd, MobileControls, overlays)
- Add Orbitron font for HUD text

The full rewrite replaces the 1,376 lines with a cleaner structure:
- ~200 lines: State machine + lifecycle
- ~150 lines: Input handling
- ~100 lines: Game loop
- ~200 lines: JSX overlays (start, pause, game over, HUD)
- Total: ~650 lines (smaller because rendering is in pixi-renderer.ts)

[Full component code would be written here — structurally similar to current but with PixiJS integration]

- [ ] **Step 2: Verify TypeScript compiles**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```

- [ ] **Step 3: Verify build passes**

Run from `client/`:
```bash
npm run build
```

---

## Task 9: Add Loading State

**Files:**
- Modify: `client/src/components/mini-game/miu9-future-run.tsx`

**Interfaces:**
- Consumes: GameAssets load progress
- Produces: Loading overlay with progress bar

- [ ] **Step 1: Add loading overlay JSX**

```tsx
{phase === 'loading' && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0E1F] via-[#131A33] to-[#0A0E1F]">
    <h2 className="mb-4 text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF6FC4] to-[#4DE8FF]" style={{ fontFamily: 'Orbitron' }}>
      MIU-9 SYSTEM INITIALIZING...
    </h2>
    <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#FF6FC4] to-[#4DE8FF] rounded-full transition-all" style={{ width: `${(loadProgress / 5) * 100}%` }} />
    </div>
    <p className="mt-2 text-xs text-[#8FA3C4]">{loadProgress}/5 ASSETS READY</p>
  </div>
)}
```

---

## Task 10: Add Pause State

**Files:**
- Modify: `client/src/components/mini-game/miu9-future-run.tsx`

**Interfaces:**
- Consumes: ESC key, window blur, pause button
- Produces: Pause overlay with TIẾP TỤC / VỀ MENU buttons

- [ ] **Step 1: Add pause overlay JSX**

```tsx
{phase === 'paused' && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
    <h2 className="mb-6 text-2xl font-bold tracking-wider text-[#FF6FC4]" style={{ fontFamily: 'Orbitron' }}>
      PAUSED
    </h2>
    <div className="flex flex-col gap-3">
      <button onClick={resumeGame} className="rounded-xl bg-gradient-to-r from-[#FF6FC4] to-[#E85DC0] px-8 py-3 text-sm font-bold text-white">
        TIẾP TỤC
      </button>
      <button onClick={returnToMenu} className="rounded-xl border border-[#4DE8FF]/30 bg-[#4DE8FF]/10 px-8 py-3 text-sm font-bold text-[#4DE8FF]">
        VỀ MENU
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add ESC key handler + window blur handler**

In the keyboard useEffect:
```typescript
if (k === 'escape') {
  if (gs.phase === 'playing') { gs.phase = 'paused'; setPhase('paused') }
  else if (gs.phase === 'paused') { gs.phase = 'playing'; setPhase('playing') }
}
```

Window blur:
```typescript
useEffect(() => {
  const handleBlur = () => {
    if (gsRef.current.phase === 'playing') {
      gsRef.current.phase = 'paused'
      setPhase('paused')
    }
  }
  window.addEventListener('blur', handleBlur)
  return () => window.removeEventListener('blur', handleBlur)
}, [])
```

---

## Task 11: Verify End-to-End

- [ ] **Step 1: TypeScript check**

Run from `client/`:
```bash
npx tsc -p tsconfig.app.json --noEmit
```

- [ ] **Step 2: Build check**

Run from `client/`:
```bash
npm run build
```

- [ ] **Step 3: Server TypeScript check**

Run from `server/`:
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Full build**

Run from root:
```bash
npm run build
```

---

## Task 12: Visual & Gameplay QA

- [ ] **Step 1: Start dev server**

```bash
cd client && npm run dev
```

- [ ] **Step 2: Visual checks**
- Loading state appears and progresses
- Menu screen shows cyberpunk city background
- Player is visible, not tiny (~80-140px)
- Bird appears at jump height
- Mouse appears on road with "!" warning
- HUD shows score (6-digit padded) and 3 hearts
- Pause overlay appears on ESC
- Game over overlay shows score + best
- No white legacy modal
- No giant empty whitespace

- [ ] **Step 3: Gameplay checks**
- W/Space/ArrowUp jumps
- S/ArrowDown ducks
- F/Mouse click shoots
- Bird kill = +4
- Mouse kill = +2
- No passive score
- 3 hearts, damage removes 1
- Invincibility after damage
- Game over at 0 hearts
- Best score persists in localStorage
- Restart resets everything

- [ ] **Step 4: Pause checks**
- ESC pauses
- Window blur pauses
- Resume continues from exact state
- Score/lives/timers preserved

- [ ] **Step 5: Mobile checks**
- Touch controls visible on mobile
- Jump/Shoot/Duck buttons work
- Multi-touch works (jump + shoot)

- [ ] **Step 6: Performance check**
- Run active gameplay for 5 seconds
- Check FPS (target: 60 desktop, 30 mobile)
- Check no memory leaks (particle count stable)

---

## Implementation Order

Execute tasks in this exact sequence:
1. Task 1 (install PixiJS)
2. Task 2 (extract game state)
3. Task 3 (particle pool)
4. Task 4 (asset manager)
5. Task 5 (parallax city)
6. Task 6 (PixiJS renderer)
7. Task 7 (visual juice)
8. Task 8 (rewrite main component)
9. Task 9 (loading state)
10. Task 10 (pause state)
11. Task 11 (verify end-to-end)
12. Task 12 (QA)

After each task, run TypeScript check to catch errors early.
