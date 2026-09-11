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

  g.pivot.set(PLAYER_W / 2, ph / 2)
  g.position.set(px + PLAYER_W / 2, py + ph / 2)

  const jumpTilt = gs.isJumping ? 0.17 : 0
  const jumpScaleY = gs.isJumping ? 1.15 : 1
  g.rotation = jumpTilt
  g.scale.set(1, jumpScaleY)

  // ── Cat ears (behind head) ──────────────────────────────────
  const earPeak = gs.isDucking ? -3 : -10
  // Left ear outer
  g.moveTo(6, 6).lineTo(3, earPeak).lineTo(15, 4).closePath().fill(0xFF6FC4)
  // Right ear outer
  g.moveTo(PLAYER_W - 6, 6).lineTo(PLAYER_W - 3, earPeak).lineTo(PLAYER_W - 15, 4).closePath().fill(0xFF6FC4)
  // Left ear inner
  g.moveTo(7, 5).lineTo(5, earPeak + 3).lineTo(13, 4).closePath().fill(0xF9A8D4)
  // Right ear inner
  g.moveTo(PLAYER_W - 7, 5).lineTo(PLAYER_W - 5, earPeak + 3).lineTo(PLAYER_W - 13, 4).closePath().fill(0xF9A8D4)

  // ── Head (oversized chibi) ──────────────────────────────────
  const headY = gs.isDucking ? -1 : -3
  const headR = gs.isDucking ? 11 : 14
  // Head shadow
  g.ellipse(PLAYER_W / 2 + 1, headY + 10, headR + 1, headR - 2).fill(0xD44A8A)
  // Head base
  g.ellipse(PLAYER_W / 2, headY + 9, headR, headR - 3).fill(0xFF6FC4)

  // ── White muzzle (lower face) ───────────────────────────────
  g.ellipse(PLAYER_W / 2, headY + 14, 7, 4).fill(0xFFF0F5)

  // ── Visor (dark band across eyes) ───────────────────────────
  g.roundRect(8, headY + 4, PLAYER_W - 16, 8, 3).fill(0x0f172a)

  // ── Eyes (huge anime, cyan glow) ────────────────────────────
  const eyeY = headY + 8
  // Eye whites
  g.ellipse(15, eyeY, 4.5, 4).fill(0xffffff)
  g.ellipse(PLAYER_W - 15, eyeY, 4.5, 4).fill(0xffffff)
  // Iris (cyan)
  g.circle(16, eyeY, 3.2).fill(0x4DE8FF)
  g.circle(PLAYER_W - 16, eyeY, 3.2).fill(0x4DE8FF)
  // Pupils
  g.circle(16.5, eyeY, 1.8).fill(0x0f172a)
  g.circle(PLAYER_W - 15.5, eyeY, 1.8).fill(0x0f172a)
  // Eye shine (white dot)
  g.circle(15, eyeY - 1.5, 1).fill(0xffffff)
  g.circle(PLAYER_W - 17, eyeY - 1.5, 1).fill(0xffffff)
  // Subtle eye glow ring
  g.circle(16, eyeY, 4.5).stroke({ width: 0.6, color: 0x4DE8FF, alpha: 0.4 })
  g.circle(PLAYER_W - 16, eyeY, 4.5).stroke({ width: 0.6, color: 0x4DE8FF, alpha: 0.4 })

  // ── Nose (dark pink triangle) ───────────────────────────────
  g.moveTo(PLAYER_W / 2 - 1.5, headY + 12).lineTo(PLAYER_W / 2, headY + 14).lineTo(PLAYER_W / 2 + 1.5, headY + 12).closePath().fill(0x9D174D)

  // ── Body (pink armor) ───────────────────────────────────────
  const bodyTop = gs.isDucking ? 3 : 14
  const bodyH = ph - bodyTop - 4
  // Body shadow
  g.roundRect(5, bodyTop + 1, PLAYER_W - 8, bodyH, 8).fill(0xD44A8A)
  // Body base
  g.roundRect(4, bodyTop, PLAYER_W - 8, bodyH, 8).fill(0xFF6FC4)
  // Armor plate highlight
  g.roundRect(6, bodyTop + 1, PLAYER_W - 12, bodyH * 0.4, 4).fill({ color: 0xF9A8D4, alpha: 0.3 })

  // ── Chest energy core (cyan) ────────────────────────────────
  const coreY = bodyTop + bodyH * 0.35
  g.circle(PLAYER_W / 2, coreY + 1, 6).fill(0x0f172a)
  g.circle(PLAYER_W / 2, coreY, 5).fill(0x0f172a)
  g.circle(PLAYER_W / 2, coreY, 3.5).fill(0x4DE8FF)
  g.circle(PLAYER_W / 2, coreY, 1.5).fill(0xecfeff)
  // Core glow ring
  g.circle(PLAYER_W / 2, coreY, 6).stroke({ width: 0.5, color: 0x4DE8FF, alpha: 0.5 })

  // ── Armor lines ─────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const ly = bodyTop + 6 + i * 5
    if (ly < ph - 6) {
      g.moveTo(10, ly).lineTo(PLAYER_W - 10, ly).stroke({ width: 0.8, color: 0xf9a8d4, alpha: 0.3 })
    }
  }

  // ── Arm cannon ──────────────────────────────────────────────
  const cannonY = bodyTop + bodyH * 0.4
  g.roundRect(PLAYER_W - 2, cannonY, 10, 6, 2).fill(0x1e293b)
  g.circle(PLAYER_W + 8, cannonY + 3, 3).fill(0x4DE8FF)
  g.circle(PLAYER_W + 8, cannonY + 3, 1.5).fill(0xecfeff)

  // ── Cyan jet thrusters ──────────────────────────────────────
  const thrusterY = ph - 4
  // Left thruster
  g.roundRect(8, thrusterY, 8, 5, 2).fill(0x0f172a)
  g.roundRect(9, thrusterY + 5, 6, 3, 1).fill({ color: 0x4DE8FF, alpha: 0.8 })
  g.roundRect(10, thrusterY + 7, 4, 2, 1).fill({ color: 0x4DE8FF, alpha: 0.4 })
  // Right thruster
  g.roundRect(PLAYER_W - 16, thrusterY, 8, 5, 2).fill(0x0f172a)
  g.roundRect(PLAYER_W - 15, thrusterY + 5, 6, 3, 1).fill({ color: 0x4DE8FF, alpha: 0.8 })
  g.roundRect(PLAYER_W - 14, thrusterY + 7, 4, 2, 1).fill({ color: 0x4DE8FF, alpha: 0.4 })

  // ── Curved cyber tail ───────────────────────────────────────
  const tailY = bodyTop + bodyH * 0.4
  g.moveTo(4, tailY)
    .quadraticCurveTo(-10, tailY - 8, -6, tailY - 16)
    .stroke({ width: 2.8, color: 0xFF6FC4 })
  // Tail tip glow
  g.circle(-6, tailY - 16, 2).fill(0x4DE8FF)

  // ── Compact mechanical legs ─────────────────────────────────
  const legY = ph - 12
  g.roundRect(10, legY, 7, 10, 2).fill(0x1e293b)
  g.roundRect(PLAYER_W - 17, legY, 7, 10, 2).fill(0x1e293b)
  // Leg cyan accent
  g.rect(11, legY + 2, 5, 1).fill(0x4DE8FF)
  g.rect(PLAYER_W - 16, legY + 2, 5, 1).fill(0x4DE8FF)
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
      const bank = Math.sin(elapsed * 0.008) * 0.1
      const thrustPulse = 0.6 + Math.sin(elapsed * 0.02) * 0.4
      const cx = o.x + o.w / 2
      const cy = o.y + o.h / 2 + hover

      const HULL = 0x1a1f35
      const HULL_LIGHT = 0x2d3555
      const EDGE = 0x8b5cf6
      const COCKPIT = 0xff1744
      const ENGINE = 0x22d3ee
      const ACCENT = 0x4DE8FF

      // ── Engine exhaust trail ─────────────────────────────────
      for (let i = 1; i <= 3; i++) {
        const alpha = 0.15 / i
        const size = i * 3
        g.ellipse(cx - o.w * 0.5 - size * 1.5, cy, size * thrustPulse, size * 0.5 * thrustPulse)
          .fill({ color: ENGINE, alpha })
      }

      // ── Swept-back wings ─────────────────────────────────────
      for (const side of [-1, 1]) {
        const tilt = side * bank * o.h
        // Main wing
        g.moveTo(cx - 2, cy + 2)
          .lineTo(cx + side * o.w * 0.62, cy + o.h * 0.5 + tilt)
          .lineTo(cx + side * o.w * 0.7, cy + o.h * 0.6 + tilt)
          .lineTo(cx + side * o.w * 0.15, cy + o.h * 0.12)
          .closePath().fill(HULL)
        // Wing edge glow
        g.moveTo(cx - 2, cy + 2)
          .lineTo(cx + side * o.w * 0.62, cy + o.h * 0.5 + tilt)
          .stroke({ width: 1.5, color: EDGE, alpha: 0.8 })
        // Wing tip light
        g.circle(cx + side * o.w * 0.65, cy + o.h * 0.55 + tilt, 2)
          .fill(side > 0 ? 0x22c55e : 0xef4444)
        // Wing inner panel line
        g.moveTo(cx, cy + 4)
          .lineTo(cx + side * o.w * 0.45, cy + o.h * 0.35 + tilt)
          .stroke({ width: 0.6, color: ACCENT, alpha: 0.3 })
      }

      // ── Canard wings (front) ─────────────────────────────────
      for (const side of [-1, 1]) {
        g.moveTo(cx + side * o.w * 0.12, cy - o.h * 0.28)
          .lineTo(cx + side * o.w * 0.35, cy - o.h * 0.38)
          .lineTo(cx + side * o.w * 0.16, cy - o.h * 0.15)
          .closePath().fill(HULL_LIGHT)
      }

      // ── Fuselage (sleek nose) ────────────────────────────────
      g.moveTo(cx + o.w * 0.5, cy)
        .lineTo(cx + o.w * 0.2, cy - o.h * 0.24)
        .lineTo(cx - o.w * 0.38, cy - o.h * 0.18)
        .lineTo(cx - o.w * 0.5, cy - o.h * 0.06)
        .lineTo(cx - o.w * 0.5, cy + o.h * 0.06)
        .lineTo(cx - o.w * 0.38, cy + o.h * 0.18)
        .lineTo(cx + o.w * 0.2, cy + o.h * 0.24)
        .closePath().fill(HULL)

      // Center fuselage panel line
      g.moveTo(cx + o.w * 0.42, cy).lineTo(cx - o.w * 0.44, cy)
        .stroke({ width: 1, color: EDGE, alpha: 0.6 })

      // Dorsal ridge
      g.moveTo(cx + o.w * 0.1, cy - o.h * 0.24)
        .lineTo(cx - o.w * 0.05, cy - o.h * 0.36)
        .lineTo(cx - o.w * 0.25, cy - o.h * 0.22)
        .closePath().fill(HULL_LIGHT)

      // ── Cockpit (red eye) ───────────────────────────────────
      g.ellipse(cx + o.w * 0.2, cy - o.h * 0.06, 7, 4.5).fill(0x0f172a)
      g.ellipse(cx + o.w * 0.2, cy - o.h * 0.06, 5.5, 3).fill(COCKPIT)
      g.ellipse(cx + o.w * 0.22, cy - o.h * 0.08, 2, 1).fill(0xffccd5)
      // Cockpit glow ring
      g.ellipse(cx + o.w * 0.2, cy - o.h * 0.06, 7, 4.5)
        .stroke({ width: 0.5, color: COCKPIT, alpha: 0.5 })

      // ── Weapon hardpoints ────────────────────────────────────
      for (const side of [-1, 1]) {
        g.roundRect(cx + side * o.w * 0.3 - 4, cy + o.h * 0.12, 8, 3, 1).fill(0x1e293b)
        g.circle(cx + side * o.w * 0.3 + (side > 0 ? 4 : -4), cy + o.h * 0.12 + 1.5, 1.5)
          .fill(0xfbbf24)
      }

      // ── Engine nacelle + thrust ──────────────────────────────
      g.roundRect(cx - o.w * 0.56, cy - o.h * 0.1, 10, o.h * 0.2, 2).fill(0x111827)
      // Engine core
      g.ellipse(cx - o.w * 0.6, cy, 5 * thrustPulse, 3.5 * thrustPulse)
        .fill({ color: ENGINE, alpha: 0.9 })
      // Engine glow
      g.ellipse(cx - o.w * 0.68, cy, 8 * thrustPulse, 2.5 * thrustPulse)
        .fill({ color: ENGINE, alpha: 0.4 })
      // Engine bright core
      g.ellipse(cx - o.w * 0.58, cy, 2.5, 1.8).fill(0xecfeff)
      // Engine rim
      g.ellipse(cx - o.w * 0.56, cy, 5, 3.5)
        .stroke({ width: 0.5, color: ENGINE, alpha: 0.6 })
    } else if (es.kind === 'mouse') {
      const bodyColor = o.isCharging ? 0x991b1b : 0x7f1d1d
      const armorColor = o.isCharging ? 0xdc2626 : 0x991b1b
      const cx = o.x + o.w / 2

      // ── Charge energy aura ───────────────────────────────────
      if (o.isCharging) {
        for (let i = 3; i >= 1; i--) {
          g.circle(cx, o.y + o.h / 2, 14 + i * 6)
            .fill({ color: 0xfbbf24, alpha: 0.06 / i })
        }
        // Speed lines
        for (let i = 0; i < 4; i++) {
          const ly = o.y + 8 + i * 10
          g.moveTo(o.x - 6 - i * 4, ly).lineTo(o.x - 18 - i * 8, ly)
            .stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.4 })
        }
      }

      // ── Compact body (dark metallic armor) ───────────────────
      g.roundRect(o.x + 2, o.y + 12, o.w - 4, o.h - 16, 5).fill(bodyColor)
      // Armor plate
      g.roundRect(o.x + 4, o.y + 14, o.w - 8, (o.h - 16) * 0.4, 3).fill(armorColor)
      // Body edge highlight
      g.roundRect(o.x + 2, o.y + 12, o.w - 4, o.h - 16, 5)
        .stroke({ width: 0.8, color: 0xef4444, alpha: 0.4 })

      // ── Head ─────────────────────────────────────────────────
      g.roundRect(o.x + 6, o.y, o.w - 12, 16, 4).fill(armorColor)

      // ── Pointed ears ─────────────────────────────────────────
      for (const side of [-1, 1]) {
        const ex = cx + side * 12
        g.moveTo(ex - 4, o.y + 4).lineTo(ex, o.y - 6).lineTo(ex + 4, o.y + 4)
          .closePath().fill(armorColor)
        g.moveTo(ex - 2.5, o.y + 3).lineTo(ex, o.y - 3).lineTo(ex + 2.5, o.y + 3)
          .closePath().fill(0xfca5a5)
      }

      // ── Red glowing eyes ─────────────────────────────────────
      g.circle(o.x + 12, o.y + 6, 4).fill(0x0f172a)
      g.circle(o.x + o.w - 12, o.y + 6, 4).fill(0x0f172a)
      g.circle(o.x + 12, o.y + 6, 2.8).fill(0xef4444)
      g.circle(o.x + o.w - 12, o.y + 6, 2.8).fill(0xef4444)
      // Eye glow
      g.circle(o.x + 12, o.y + 6, 4).stroke({ width: 0.5, color: 0xef4444, alpha: 0.6 })
      g.circle(o.x + o.w - 12, o.y + 6, 4).stroke({ width: 0.5, color: 0xef4444, alpha: 0.6 })
      // Eye shine
      g.circle(o.x + 11, o.y + 5, 1).fill(0xffffff)
      g.circle(o.x + o.w - 13, o.y + 5, 1).fill(0xffffff)

      // ── Nose ─────────────────────────────────────────────────
      g.circle(cx, o.y + 11, 1.5).fill(0x1e293b)

      // ── Red laser sword ──────────────────────────────────────
      const swordY = o.y + 16
      // Blade
      g.moveTo(o.x + o.w - 2, swordY)
        .lineTo(o.x + o.w + 16, swordY - 3)
        .lineTo(o.x + o.w + 18, swordY - 1)
        .lineTo(o.x + o.w + 2, swordY + 2)
        .closePath().fill(0xef4444)
      // Blade energy edge
      g.moveTo(o.x + o.w, swordY - 0.5)
        .lineTo(o.x + o.w + 16, swordY - 3.5)
        .stroke({ width: 1, color: 0xfca5a5, alpha: 0.8 })
      // Blade tip glow
      g.circle(o.x + o.w + 17, swordY - 2, 2).fill({ color: 0xef4444, alpha: 0.5 })

      // ── Mechanical legs ──────────────────────────────────────
      const legOff = o.isCharging ? 4 : 0
      g.roundRect(o.x + 8 - legOff, o.y + o.h - 10, 7, 10, 2).fill(0x1e293b)
      g.roundRect(o.x + o.w - 15 + legOff, o.y + o.h - 10, 7, 10, 2).fill(0x1e293b)
      // Leg cyan accent
      g.rect(o.x + 9 - legOff, o.y + o.h - 8, 5, 1).fill(0x4DE8FF)
      g.rect(o.x + o.w - 14 + legOff, o.y + o.h - 8, 5, 1).fill(0x4DE8FF)

      // ── Charge warning indicator ─────────────────────────────
      if (o.chargeTriggered && !o.isCharging) {
        g.circle(cx, o.y - 14, 12).fill({ color: 0xfbbf24, alpha: 0.25 })
        g.circle(cx, o.y - 14, 8).fill({ color: 0xfbbf24, alpha: 0.4 })
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
