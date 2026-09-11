// client/src/components/mini-game/parallax-city.ts
import * as PIXI from 'pixi.js'
import { CANVAS_W, CANVAS_H, GROUND_Y } from './game-state'

// Safe modulo that always returns a non-negative result
function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

// Design tokens
const NAVY1 = 0x0A0E1F
const NAVY2 = 0x131A33
const PINK = 0xFF6FC4
const CYAN = 0x4DE8FF
const PURPLE = 0xB98BFF
const DARK_BLUE = 0x0f1729

// Source of truth: count + spacing define the grid.
// Pattern width = count × spacing (clone starts at exact grid period).
const DISTANT_COUNT = 24
const DISTANT_SPACING = 65
const DISTANT_PATTERN_W = DISTANT_COUNT * DISTANT_SPACING // 1560

const MID_COUNT = 16
const MID_SPACING = 95
const MID_PATTERN_W = MID_COUNT * MID_SPACING // 1520

const STREET_COUNT = 14
const STREET_SPACING = 110
const STREET_PATTERN_W = STREET_COUNT * STREET_SPACING // 1540

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
    // Gradient sky — dark navy base
    g.rect(0, 0, CANVAS_W, GROUND_Y).fill(NAVY1)
    // Atmospheric haze near horizon
    g.rect(0, GROUND_Y - 120, CANVAS_W, 120).fill({ color: PURPLE, alpha: 0.03 })
    g.rect(0, GROUND_Y - 60, CANVAS_W, 60).fill({ color: CYAN, alpha: 0.04 })
    // Stars with varied brightness
    for (let i = 0; i < 100; i++) {
      const sx = (i * 137.5) % CANVAS_W
      const sy = (i * 73.1) % (GROUND_Y - 60)
      const brightness = 0.2 + Math.random() * 0.5
      const size = Math.random() > 0.85 ? 1.5 : 0.8
      g.circle(sx, sy, size).fill({ color: 0xffffff, alpha: brightness })
    }
    // Distant nebula glow
    g.circle(CANVAS_W * 0.3, GROUND_Y * 0.3, 120).fill({ color: PINK, alpha: 0.02 })
    g.circle(CANVAS_W * 0.7, GROUND_Y * 0.25, 90).fill({ color: PURPLE, alpha: 0.025 })
    return g
  }

  private createDistantBuildings() {
    const g = new PIXI.Graphics()
    // Distant skyline — dark silhouettes with subtle neon windows
    for (let i = 0; i < DISTANT_COUNT; i++) {
      const x = i * DISTANT_SPACING
      const h = 50 + Math.random() * 140
      const w = 25 + Math.random() * 35
      // Building body
      g.rect(x, GROUND_Y - h, w, h).fill({ color: 0x151b30, alpha: 0.7 })
      // Roof antenna/spire on some buildings
      if (Math.random() > 0.7) {
        g.rect(x + w / 2 - 1, GROUND_Y - h - 12, 2, 12).fill({ color: 0x1a2040, alpha: 0.5 })
        g.circle(x + w / 2, GROUND_Y - h - 12, 1.5).fill({ color: PINK, alpha: 0.4 })
      }
      // Neon window dots
      for (let wy = GROUND_Y - h + 8; wy < GROUND_Y - 8; wy += 10) {
        for (let wx = x + 4; wx < x + w - 4; wx += 7) {
          if (Math.random() > 0.55) {
            const c = Math.random() > 0.6 ? PINK : Math.random() > 0.3 ? CYAN : PURPLE
            g.rect(wx, wy, 2, 3).fill({ color: c, alpha: 0.25 + Math.random() * 0.15 })
          }
        }
      }
    }
    // Two copies for seamless loop — clone reuses exact same geometry, no new Math.random()
    this.distantBuildings.push(g)
    const gClone = g.clone()
    this.distantBuildings.push(gClone)
    this.distantLayer.addChild(g)
    this.distantLayer.addChild(gClone)
    gClone.x = DISTANT_PATTERN_W
  }

  private createMidBuildings() {
    const g = new PIXI.Graphics()
    // Mid-height buildings — more detail, neon signs
    for (let i = 0; i < MID_COUNT; i++) {
      const x = i * MID_SPACING
      const h = 100 + Math.random() * 220
      const w = 45 + Math.random() * 50
      // Building body
      g.roundRect(x, GROUND_Y - h, w, h, 2).fill(NAVY2)
      // Building edge highlight
      g.rect(x, GROUND_Y - h, 1, h).fill({ color: CYAN, alpha: 0.08 })
      g.rect(x + w - 1, GROUND_Y - h, 1, h).fill({ color: PINK, alpha: 0.06 })
      // Neon signs on some buildings
      if (Math.random() > 0.4) {
        const signColor = Math.random() > 0.5 ? PINK : PURPLE
        const signY = GROUND_Y - h + 15 + Math.random() * 30
        g.roundRect(x + 6, signY, w - 12, 10, 2).fill({ color: signColor, alpha: 0.35 })
        // Sign glow
        g.roundRect(x + 4, signY - 2, w - 8, 14, 3).fill({ color: signColor, alpha: 0.08 })
      }
      // Windows — cyan grid pattern
      for (let wy = GROUND_Y - h + 35; wy < GROUND_Y - 10; wy += 14) {
        for (let wx = x + 7; wx < x + w - 7; wx += 10) {
          if (Math.random() > 0.35) {
            const lit = Math.random() > 0.4
            g.rect(wx, wy, 5, 7).fill({ color: lit ? CYAN : DARK_BLUE, alpha: lit ? 0.2 : 0.3 })
          }
        }
      }
    }
    // Two copies for seamless loop
    this.midBuildings.push(g)
    const gClone = g.clone()
    this.midBuildings.push(gClone)
    this.midLayer.addChild(g)
    this.midLayer.addChild(gClone)
    gClone.x = MID_PATTERN_W
  }

  private createStreetObjects() {
    const g = new PIXI.Graphics()
    // Street lamps with cyan glow
    for (let i = 0; i < STREET_COUNT; i++) {
      const x = i * STREET_SPACING
      // Lamp post
      g.rect(x, GROUND_Y - 55, 2, 55).fill({ color: 0x2a3050, alpha: 0.6 })
      // Lamp head
      g.roundRect(x - 4, GROUND_Y - 58, 10, 5, 2).fill({ color: 0x334155, alpha: 0.5 })
      // Lamp glow
      g.circle(x + 1, GROUND_Y - 58, 4).fill({ color: CYAN, alpha: 0.35 })
      g.circle(x + 1, GROUND_Y - 58, 8).fill({ color: CYAN, alpha: 0.08 })
    }
    // Small neon signs at street level
    for (let i = 0; i < 6; i++) {
      const x = i * 220 + 80
      const signColor = [PINK, CYAN, PURPLE][i % 3]
      g.roundRect(x, GROUND_Y - 30, 30, 8, 2).fill({ color: signColor, alpha: 0.3 })
    }
    // Two copies for seamless loop
    this.streetObjects.push(g)
    const gClone = g.clone()
    this.streetObjects.push(gClone)
    this.streetLayer.addChild(g)
    this.streetLayer.addChild(gClone)
    gClone.x = STREET_PATTERN_W
  }

  private createRoad() {
    const g = new PIXI.Graphics()
    const roadH = CANVAS_H - GROUND_Y
    const roadW = CANVAS_W * 2

    // Road base — dark asphalt (2x wide for seamless scroll wrap)
    g.rect(0, GROUND_Y, roadW, roadH).fill(NAVY2)

    // Subtle road surface texture — horizontal panels
    for (let y = 8; y < roadH; y += 20) {
      g.rect(0, GROUND_Y + y, roadW, 1).fill({ color: 0x1a2240, alpha: 0.3 })
    }

    // Neon edge at top (road boundary)
    g.rect(0, GROUND_Y, roadW, 2).fill({ color: CYAN, alpha: 0.7 })
    g.rect(0, GROUND_Y + 2, roadW, 1).fill({ color: CYAN, alpha: 0.2 })

    // Neon edge at bottom
    g.rect(0, GROUND_Y + roadH - 2, roadW, 2).fill({ color: PINK, alpha: 0.3 })

    // Lane markings (scrolling dashed lines) — duplicated for 2x width
    for (let i = 0; i < 44; i++) {
      const lx = i * 65
      g.roundRect(lx, GROUND_Y + roadH * 0.45, 28, 2, 1).fill({ color: CYAN, alpha: 0.2 })
    }

    // Road reflection — subtle mirrored glow from above
    g.rect(0, GROUND_Y + roadH * 0.6, roadW, roadH * 0.4).fill({ color: CYAN, alpha: 0.02 })
    g.rect(0, GROUND_Y + roadH * 0.7, roadW, roadH * 0.3).fill({ color: PINK, alpha: 0.015 })

    this.roadLayer.addChild(g)
  }

  update(bgOffset: number, scrollOffset: number) {
    // Each layer wraps independently at its own pattern width.
    // Do NOT pre-wrap bgOffset by Math.max(...) — that causes discontinuities
    // when different parallax speeds cause the wrapped value to jump.
    const distantOffset = positiveModulo(bgOffset * 0.3, DISTANT_PATTERN_W)
    const midOffset = positiveModulo(bgOffset * 0.6, MID_PATTERN_W)
    const streetOffset = positiveModulo(bgOffset * 1.0, STREET_PATTERN_W)

    // Distant: slow parallax
    this.distantLayer.x = -distantOffset
    // Mid: medium parallax
    this.midLayer.x = -midOffset
    // Street: fast parallax
    this.streetLayer.x = -streetOffset
    // Road: fastest (2x width, wraps by CANVAS_W)
    this.roadLayer.x = -(scrollOffset * 0.5) % CANVAS_W
  }
}
