// client/src/components/mini-game/parallax-city.ts
import * as PIXI from 'pixi.js'
import { CANVAS_W, CANVAS_H, GROUND_Y } from './game-state'

// Design tokens
const NAVY1 = 0x0A0E1F
const NAVY2 = 0x131A33
const PINK = 0xFF6FC4
const CYAN = 0x4DE8FF
const PURPLE = 0xB98BFF
const DARK_BLUE = 0x0f1729

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
    for (let i = 0; i < 24; i++) {
      const x = i * 65
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
    this.distantBuildings.push(g)
    this.distantLayer.addChild(g)
  }

  private createMidBuildings() {
    const g = new PIXI.Graphics()
    // Mid-height buildings — more detail, neon signs
    for (let i = 0; i < 16; i++) {
      const x = i * 95
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
    this.midBuildings.push(g)
    this.midLayer.addChild(g)
  }

  private createStreetObjects() {
    const g = new PIXI.Graphics()
    // Street lamps with cyan glow
    for (let i = 0; i < 14; i++) {
      const x = i * 110
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
    this.streetObjects.push(g)
    this.streetLayer.addChild(g)
  }

  private createRoad() {
    const g = new PIXI.Graphics()
    const roadH = CANVAS_H - GROUND_Y

    // Road base — dark asphalt
    g.rect(0, 0, CANVAS_W, roadH).fill(NAVY2)

    // Subtle road surface texture — horizontal panels
    for (let y = 8; y < roadH; y += 20) {
      g.rect(0, y, CANVAS_W, 1).fill({ color: 0x1a2240, alpha: 0.3 })
    }

    // Neon edge at top (road boundary)
    g.rect(0, 0, CANVAS_W, 2).fill({ color: CYAN, alpha: 0.7 })
    g.rect(0, 2, CANVAS_W, 1).fill({ color: CYAN, alpha: 0.2 })

    // Neon edge at bottom
    g.rect(0, roadH - 2, CANVAS_W, 2).fill({ color: PINK, alpha: 0.3 })

    // Lane markings (scrolling dashed lines)
    for (let i = 0; i < 22; i++) {
      const lx = i * 65
      g.roundRect(lx, roadH * 0.45, 28, 2, 1).fill({ color: CYAN, alpha: 0.2 })
    }

    // Road reflection — subtle mirrored glow from above
    g.rect(0, roadH * 0.6, CANVAS_W, roadH * 0.4).fill({ color: CYAN, alpha: 0.02 })
    g.rect(0, roadH * 0.7, CANVAS_W, roadH * 0.3).fill({ color: PINK, alpha: 0.015 })

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
