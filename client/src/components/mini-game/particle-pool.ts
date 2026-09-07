// client/src/components/mini-game/particle-pool.ts
import * as PIXI from 'pixi.js'

const MAX_PARTICLES = 80

export class ParticlePool {
  private pool: PIXI.Graphics[] = []
  private active: Set<PIXI.Graphics> = new Set()

  constructor(container: PIXI.Container) {
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
