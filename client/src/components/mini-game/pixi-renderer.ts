// client/src/components/mini-game/pixi-renderer.ts
import * as PIXI from 'pixi.js'
import { GlowFilter } from 'pixi-filters/glow'
import {
  type GameState, CANVAS_W, CANVAS_H,
  PLAYER_X, PLAYER_W, PLAYER_H, PLAYER_DUCK_H,
  LASER_W, LASER_H, ENEMY_LASER_W, ENEMY_LASER_H,
  INVINCIBILITY_MS,
} from './game-state'
import { ParallaxCity } from './parallax-city'
import { ParticlePool } from './particle-pool'

interface EnemySprite {
  kind: 'robot' | 'bird' | 'mouse'
  gfx: PIXI.Graphics
  warningGfx: PIXI.Graphics
  warningText: PIXI.Text | null
  id: number
}

interface LaserSprite {
  type: 'player' | 'enemy'
  gfx: PIXI.Graphics
  id: number
}

export class PixiRenderer {
  app: PIXI.Application
  private city: ParallaxCity
  private particles: ParticlePool

  private bgContainer = new PIXI.Container()
  private roadContainer = new PIXI.Container()
  private enemyContainer = new PIXI.Container()
  private playerContainer = new PIXI.Container()
  private laserContainer = new PIXI.Container()
  private particleContainer = new PIXI.Container()
  private uiContainer = new PIXI.Container()

  private playerGfx = new PIXI.Graphics()
  private playerGlow: GlowFilter | null = null

  private enemySprites: EnemySprite[] = []
  private laserSprites: LaserSprite[] = []

  private floatingTexts: PIXI.Text[] = []
  private muzzleFlash: PIXI.Graphics | null = null
  private muzzleTimer = 0

  private vignette = new PIXI.Graphics()

  private shakeContainer = new PIXI.Container()

  private spawnedParticleIds = new Set<number>()
  private initialized = false
  private prevLaserCount = 0

  constructor() {
    this.app = new PIXI.Application()
    this.city = new ParallaxCity()
    this.particles = new ParticlePool(this.particleContainer)
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

    this.shakeContainer.addChild(this.bgContainer)
    this.shakeContainer.addChild(this.roadContainer)
    this.shakeContainer.addChild(this.enemyContainer)
    this.shakeContainer.addChild(this.playerContainer)
    this.shakeContainer.addChild(this.laserContainer)
    this.shakeContainer.addChild(this.particleContainer)
    this.shakeContainer.addChild(this.uiContainer)
    this.app.stage.addChild(this.shakeContainer)

    this.bgContainer.addChild(this.city.skyLayer)
    this.bgContainer.addChild(this.city.distantLayer)
    this.bgContainer.addChild(this.city.midLayer)
    this.bgContainer.addChild(this.city.streetLayer)
    this.roadContainer.addChild(this.city.roadLayer)

    this.playerGlow = new GlowFilter({ distance: 15, outerStrength: 2, color: 0xFF6FC4 })
    this.playerContainer.addChild(this.playerGfx)
    this.playerContainer.filters = [this.playerGlow]

    this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000000, alpha: 0 })
    this.uiContainer.addChild(this.vignette)

    this.muzzleFlash = new PIXI.Graphics()
    this.muzzleFlash.visible = false
    this.uiContainer.addChild(this.muzzleFlash)

    this.initialized = true
  }

  update(gs: GameState, dt = 1 / 60) {
    if (gs.shakeTimer > 0) {
      const intensity = gs.shakeTimer / 300 * 6
      this.shakeContainer.x = (Math.random() - 0.5) * intensity
      this.shakeContainer.y = (Math.random() - 0.5) * intensity
    } else {
      this.shakeContainer.x = 0
      this.shakeContainer.y = 0
    }

    this.city.update(gs.bgOffset, gs.scrollOffset)

    this.renderPlayer(gs)
    this.syncEnemies(gs)
    this.syncLasers(gs)
    this.syncEnemyLasers(gs)
    this.syncParticles(gs, dt)
    this.syncFloatingTexts(gs)

    // Muzzle flash timer
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt * 1000
      if (this.muzzleTimer <= 0 && this.muzzleFlash) {
        this.muzzleFlash.visible = false
      }
    }

    // Vignette: red on damage, dark navy during slow-mo, dark on gameover
    if (gs.invTimer > 0 && gs.invTimer > INVINCIBILITY_MS - 200) {
      this.vignette.clear()
      this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0xff0000, alpha: 0.15 })
    } else if (gs.slowMotionTimer > 0) {
      const alpha = Math.min(0.6, (600 - gs.slowMotionTimer) / 600 * 0.6)
      this.vignette.clear()
      this.vignette.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x0a0e1f, alpha })
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

  if (gs.invTimer > 0 && Math.floor(gs.invTimer / 50) % 2 === 0) {
    g.alpha = 0.3
  } else {
    g.alpha = 1
  }

  // ── World placement ─────────────────────────────────────────
  // Draw everything below in LOCAL coordinates (as if the character
  // always stood at (0,0)), then move the whole graphic into the
  // world with g.position, and rotate/scale around its own center
  // with g.pivot. This keeps the jump tilt/squash centered on the
  // cat itself instead of the world origin (0,0) — which is what
  // made the sprite visibly fly away from its real hitbox while
  // jumping. Lasers were unaffected because they never go through
  // this rotation/scale step.
  g.pivot.set(PLAYER_W / 2, ph / 2)
  g.position.set(px + PLAYER_W / 2, py + ph / 2)

  // Jump animation: tilt +10°, scale.y 1.15 — now correctly centered
  const jumpTilt = gs.isJumping ? 0.17 : 0
  const jumpScaleY = gs.isJumping ? 1.15 : 1
  g.rotation = jumpTilt
  g.scale.set(1, jumpScaleY)

  // From here on, (0,0) is the top-left of the character's own
  // bounding box (PLAYER_W x ph) — same layout as before, just with
  // px/py removed from every draw call.

  // Body
  g.roundRect(4, (gs.isDucking ? 2 : 10), PLAYER_W - 8, ph - (gs.isDucking ? 4 : 14), 10)
    .fill(0xFF6FC4)

  // Head
  const headY = gs.isDucking ? 0 : -2
  g.ellipse(PLAYER_W / 2, headY + 9, 14, 11).fill(0xFF6FC4)

  // Ears
  g.moveTo(8, headY + 4).lineTo(5, headY - 8).lineTo(16, headY + 2).closePath().fill(0xFF6FC4)
  g.moveTo(PLAYER_W - 8, headY + 4).lineTo(PLAYER_W - 5, headY - 8).lineTo(PLAYER_W - 16, headY + 2).closePath().fill(0xFF6FC4)

  // Inner ears
  g.moveTo(9, headY + 3).lineTo(7, headY - 5).lineTo(14, headY + 2).closePath().fill(0xF9A8D4)
  g.moveTo(PLAYER_W - 9, headY + 3).lineTo(PLAYER_W - 7, headY - 5).lineTo(PLAYER_W - 14, headY + 2).closePath().fill(0xF9A8D4)

  // Visor
  g.roundRect(9, headY + 5, PLAYER_W - 18, 7, 3).fill(0x0f172a)

  // Eyes
  g.circle(16, headY + 9, 3.5).fill(0x4DE8FF)
  g.circle(PLAYER_W - 16, headY + 9, 3.5).fill(0x4DE8FF)

  // Eye cores
  g.circle(16, headY + 9, 1.2).fill(0xecfeff)
  g.circle(PLAYER_W - 16, headY + 9, 1.2).fill(0xecfeff)

  // Nose
  g.moveTo(PLAYER_W / 2 - 2, headY + 13).lineTo(PLAYER_W / 2, headY + 15).lineTo(PLAYER_W / 2 + 2, headY + 13).closePath().fill(0x9d174d)

  // Arm cannon
  g.roundRect(PLAYER_W - 2, 16, 10, 6, 2).fill(0x1e293b)
  g.circle(PLAYER_W + 8, 19, 3).fill(0x4DE8FF)

  // Chest core
  g.circle(PLAYER_W / 2, ph * 0.45, 5).fill(0x0f172a)
  g.circle(PLAYER_W / 2, ph * 0.45, 3).fill(0x4DE8FF)

  // Tail
  g.moveTo(4, ph * 0.4)
    .quadraticCurveTo(-8, ph * 0.2, -4, ph * 0.1)
    .stroke({ width: 2.5, color: 0xFF6FC4 })

  // Armor lines
  for (let i = 0; i < 3; i++) {
    const ly = 16 + i * 6
    if (ly < ph - 6) {
      g.moveTo(10, ly).lineTo(PLAYER_W - 10, ly).stroke({ width: 0.8, color: 0xf9a8d4, alpha: 0.3 })
    }
  }
}

  private syncEnemies(gs: GameState) {
    for (let i = this.enemySprites.length - 1; i >= 0; i--) {
      const es = this.enemySprites[i]
      if (!gs.obstacles.find(o => o.id === es.id)) {
        this.enemyContainer.removeChild(es.gfx)
        this.enemyContainer.removeChild(es.warningGfx)
        es.gfx.destroy()
        es.warningGfx.destroy()
        if (es.warningText) { es.warningText.destroy(); es.warningText = null }
        this.enemySprites.splice(i, 1)
      }
    }

    for (const o of gs.obstacles) {
      let es = this.enemySprites.find(s => s.id === o.id)
      if (!es) {
        const warnGfx = new PIXI.Graphics()
        this.enemyContainer.addChild(warnGfx)
        const warnText = new PIXI.Text({
          text: '!',
          style: { fontFamily: 'Orbitron, monospace', fontSize: 16, fill: 0xFFD24D, fontWeight: 'bold' },
        })
        warnText.anchor.set(0.5)
        warnText.visible = false
        this.enemyContainer.addChild(warnText)
        es = { kind: o.kind, gfx: new PIXI.Graphics(), warningGfx: warnGfx, warningText: warnText, id: o.id }
        this.enemyContainer.addChild(es.gfx)
        this.enemySprites.push(es)
      }
      this.drawEnemy(es, o, gs.elapsed)
      this.drawMouseWarning(es, o, gs)
    }
  }

  private drawEnemy(es: EnemySprite, o: { x: number; y: number; w: number; h: number; flash: number; isCharging: boolean; chargeTriggered: boolean }, elapsed: number) {
    const g = es.gfx
    g.clear()

    if (o.flash > 0) g.alpha = 0.6 + o.flash * 0.4
    else g.alpha = 1

    if (es.kind === 'robot') {
      g.roundRect(o.x + 2, o.y + 10, o.w - 4, o.h - 14, 5).fill(0xf97316)
      g.roundRect(o.x + 6, o.y, o.w - 12, 16, 4).fill(0xf97316)
      g.rect(o.x + 10, o.y + 5, 6, 5).fill(0xfbbf24)
      g.rect(o.x + o.w - 16, o.y + 5, 6, 5).fill(0xfbbf24)
      g.roundRect(o.x - 6, o.y + 18, 10, 5, 2).fill(0x9a3412)
      g.circle(o.x - 6, o.y + 20.5, 2.5).fill(0xfbbf24)
      g.rect(o.x + 8, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      g.rect(o.x + o.w - 14, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
    } else if (es.kind === 'bird') {
      const hover = Math.sin(elapsed * 0.005) * 3
      const bank = Math.sin(elapsed * 0.008) * 0.08 // nghiêng cánh nhẹ khi bay
      const thrustPulse = 0.6 + Math.sin(elapsed * 0.02) * 0.4
      const cx = o.x + o.w / 2
      const cy = o.y + o.h / 2 + hover

      const HULL = 0x2a2f45       // thân xám-xanh đậm
      const HULL_LIGHT = 0x4b5470 // panel sáng hơn
      const EDGE = 0x8b5cf6       // viền tím-xanh phát sáng
      const COCKPIT = 0xff1744    // kính đỏ
      const ENGINE = 0x22d3ee     // lửa phản lực cyan

      g.rotation ? null : null // (no-op, giữ graphics local không đổi rotation container)

      // ── Cánh sau xoè ngược (swept wings) ──────────────────────────
      for (const side of [-1, 1]) {
        const tilt = side * bank * o.h
        g.moveTo(cx - 2, cy + 2)
          .lineTo(cx + side * o.w * 0.62, cy + o.h * 0.5 + tilt)
          .lineTo(cx + side * o.w * 0.68, cy + o.h * 0.58 + tilt)
          .lineTo(cx + side * o.w * 0.15, cy + o.h * 0.12)
          .closePath().fill(HULL)
        // Viền cánh sáng
        g.moveTo(cx - 2, cy + 2)
          .lineTo(cx + side * o.w * 0.62, cy + o.h * 0.5 + tilt)
          .stroke({ width: 1.2, color: EDGE, alpha: 0.7 })
        // Đèn cảnh báo đầu cánh
        g.circle(cx + side * o.w * 0.65, cy + o.h * 0.55 + tilt, 1.8).fill(side > 0 ? 0x22c55e : 0xef4444)
      }

      // ── Cánh mũi nhỏ phía trước (canard) ────────────────────────────
      for (const side of [-1, 1]) {
        g.moveTo(cx + side * o.w * 0.12, cy - o.h * 0.28)
          .lineTo(cx + side * o.w * 0.32, cy - o.h * 0.36)
          .lineTo(cx + side * o.w * 0.14, cy - o.h * 0.15)
          .closePath().fill(HULL_LIGHT)
      }

      // ── Thân máy bay (fuselage) — thoi dài, mũi nhọn ────────────────
      g.moveTo(cx + o.w * 0.48, cy)                    // mũi nhọn
        .lineTo(cx + o.w * 0.2, cy - o.h * 0.22)
        .lineTo(cx - o.w * 0.38, cy - o.h * 0.16)
        .lineTo(cx - o.w * 0.5, cy - o.h * 0.05)
        .lineTo(cx - o.w * 0.5, cy + o.h * 0.05)
        .lineTo(cx - o.w * 0.38, cy + o.h * 0.16)
        .lineTo(cx + o.w * 0.2, cy + o.h * 0.22)
        .closePath().fill(HULL)

      // Panel line sáng dọc thân
      g.moveTo(cx + o.w * 0.4, cy).lineTo(cx - o.w * 0.42, cy)
        .stroke({ width: 1, color: EDGE, alpha: 0.5 })

      // Sống lưng giáp (dorsal ridge)
      g.moveTo(cx + o.w * 0.1, cy - o.h * 0.22)
        .lineTo(cx - o.w * 0.05, cy - o.h * 0.34)
        .lineTo(cx - o.w * 0.25, cy - o.h * 0.2)
        .closePath().fill(HULL_LIGHT)

      // ── Buồng lái / mắt kính đỏ (cockpit) ───────────────────────────
      g.ellipse(cx + o.w * 0.18, cy - o.h * 0.06, 7, 4).fill(0x0f172a)
      g.ellipse(cx + o.w * 0.18, cy - o.h * 0.06, 5, 2.6).fill(COCKPIT)
      g.ellipse(cx + o.w * 0.2, cy - o.h * 0.08, 1.8, 0.8).fill(0xffccd5)

      // ── Vũ khí gắn dưới cánh (hardpoint) ────────────────────────────
      for (const side of [-1, 1]) {
        g.roundRect(cx + side * o.w * 0.28 - 4, cy + o.h * 0.1, 8, 3, 1).fill(0x1e293b)
        g.circle(cx + side * o.w * 0.28 + (side > 0 ? 4 : -4), cy + o.h * 0.1 + 1.5, 1.2).fill(0xfbbf24)
      }

      // ── Động cơ phản lực + lửa phụt (đuôi) ──────────────────────────
      g.roundRect(cx - o.w * 0.56, cy - o.h * 0.08, 8, o.h * 0.16, 2).fill(0x111827)
      // Lõi lửa
      g.ellipse(cx - o.w * 0.6, cy, 5 * thrustPulse, 3.5 * thrustPulse).fill({ color: ENGINE, alpha: 0.9 })
      g.ellipse(cx - o.w * 0.68, cy, 8 * thrustPulse, 2.5 * thrustPulse).fill({ color: ENGINE, alpha: 0.4 })
      g.ellipse(cx - o.w * 0.58, cy, 2.5, 1.8).fill(0xecfeff)
    } else if (es.kind === 'mouse') {
      const bodyColor = o.isCharging ? 0xdc2626 : 0xef4444
      g.roundRect(o.x + 2, o.y + 10, o.w - 4, o.h - 14, 5).fill(bodyColor)
      g.roundRect(o.x + 6, o.y, o.w - 12, 16, 4).fill(bodyColor)
      g.circle(o.x + 8, o.y + 2, 5).fill(bodyColor)
      g.circle(o.x + o.w - 8, o.y + 2, 5).fill(bodyColor)
      g.circle(o.x + 8, o.y + 2, 3).fill(0xfca5a5)
      g.circle(o.x + o.w - 8, o.y + 2, 3).fill(0xfca5a5)
      g.rect(o.x + 12, o.y + 5, 5, 5).fill(o.chargeTriggered ? 0xfbbf24 : 0xffffff)
      g.rect(o.x + o.w - 17, o.y + 5, 5, 5).fill(o.chargeTriggered ? 0xfbbf24 : 0xffffff)
      g.circle(o.x + o.w / 2, o.y + 12, 2).fill(0x1e293b)
      g.moveTo(o.x + o.w - 2, o.y + 16)
        .lineTo(o.x + o.w + 14, o.y + 12)
        .lineTo(o.x + o.w + 16, o.y + 14)
        .lineTo(o.x + o.w + 2, o.y + 18)
        .closePath().fill(0xd1d5db)
      const legOff = o.isCharging ? 4 : 0
      g.rect(o.x + 8 - legOff, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      g.rect(o.x + o.w - 14 + legOff, o.y + o.h - 10, 6, 10).fill(0x1e1e2e)
      if (o.isCharging) {
        for (let i = 0; i < 3; i++) {
          const ly = o.y + 10 + i * 12
          g.moveTo(o.x - 10 - i * 5, ly).lineTo(o.x - 20 - i * 8, ly)
            .stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.5 })
        }
      }
      if (o.chargeTriggered && !o.isCharging) {
        g.circle(o.x + o.w / 2, o.y - 16, 12).fill({ color: 0xfbbf24, alpha: 0.3 })
      }
    }
  }

  private drawMouseWarning(es: EnemySprite, o: { x: number; y: number; w: number; h: number; chargeTriggered: boolean; isCharging: boolean }, gs: GameState) {
    const g = es.warningGfx
    g.clear()
    if (es.kind !== 'mouse' || !o.chargeTriggered || o.isCharging || !es.warningText) {
      g.visible = false
      if (es.warningText) es.warningText.visible = false
      return
    }
    g.visible = true
    es.warningText.visible = true
    // Bounce animation: pulse between 1.0 and 1.2
    const t = (gs.elapsed % 500) / 500
    const bounce = 1 + Math.sin(t * Math.PI * 4) * 0.2
    const cx = o.x + o.w / 2
    // Offset warnings vertically by 24px per obstacle index to prevent overlap
    const warningIndex = gs.obstacles.filter(ob => ob.kind === 'mouse' && ob.chargeTriggered && !ob.isCharging).findIndex(ob => ob.id === es.id)
    const cy = o.y - 22 - (warningIndex >= 0 ? warningIndex * 24 : 0)
    // Yellow ring pulse
    g.circle(cx, cy, 14 * bounce).fill({ color: 0xFFD24D, alpha: 0.25 })
    g.circle(cx, cy, 10 * bounce).fill({ color: 0xFFD24D, alpha: 0.4 })
    // "!" text
    es.warningText.x = cx
    es.warningText.y = cy
    es.warningText.scale.set(bounce)
  }

  private syncLasers(gs: GameState) {
    // Detect new player laser → trigger muzzle flash
    if (gs.lasers.length > this.prevLaserCount && this.muzzleFlash) {
      this.muzzleFlash.clear()
      this.muzzleFlash.circle(PLAYER_X + PLAYER_W + 10, gs.playerY + 16, 8).fill({ color: 0x4DE8FF, alpha: 0.7 })
      this.muzzleFlash.circle(PLAYER_X + PLAYER_W + 10, gs.playerY + 16, 14).fill({ color: 0x4DE8FF, alpha: 0.3 })
      this.muzzleFlash.x = 0
      this.muzzleFlash.y = 0
      this.muzzleFlash.visible = true
      this.muzzleTimer = 80
    }
    this.prevLaserCount = gs.lasers.length

    for (let i = this.laserSprites.length - 1; i >= 0; i--) {
      const ls = this.laserSprites[i]
      if (ls.type === 'player' && !gs.lasers.find(l => l.id === ls.id)) {
        this.laserContainer.removeChild(ls.gfx)
        ls.gfx.destroy()
        this.laserSprites.splice(i, 1)
      }
    }
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

  private syncParticles(gs: GameState, dt: number) {
    for (const p of gs.particles) {
      if (!this.spawnedParticleIds.has(p.id)) {
        this.particles.spawn(p.x, p.y, p.vx, p.vy, p.life, p.color, p.size)
        this.spawnedParticleIds.add(p.id)
      }
    }
    for (const p of gs.particles) {
      this.spawnedParticleIds.delete(p.id)
    }
    this.particles.update(dt)
  }

  private syncFloatingTexts(gs: GameState) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i]
      if (!gs.floatingTexts.find(f => f.text === (ft as any)._text && Math.abs(f.x - ft.x) < 5)) {
        this.uiContainer.removeChild(ft)
        ft.destroy()
        this.floatingTexts.splice(i, 1)
      }
    }
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
        });
        (text as any)._text = ft.text
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
    if (!this.initialized) return
    try {
      this.app.destroy(true)
    } catch {
      // Safe cleanup
    }
  }
}
