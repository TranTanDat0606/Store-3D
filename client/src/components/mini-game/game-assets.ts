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

  async load(renderer?: PIXI.Renderer, onProgress?: (loaded: number, total: number) => void) {
    if (this.loaded) return
    const types: AssetType[] = ['player', 'bird-robot', 'mouse-robot', 'background', 'road']
    let loaded = 0

    await Promise.allSettled(
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
        this.textures.set(type, this.generateFallback(type, renderer))
      }
    }
    this.loaded = true
  }

  getTexture(type: AssetType): PIXI.Texture {
    return this.textures.get(type) || this.generateFallback(type)
  }

  private generateFallback(type: AssetType, renderer?: PIXI.Renderer): PIXI.Texture {
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
        g.rect(12, 5, 5, 5).fill(0xffffff) // eye
        g.rect(31, 5, 5, 5).fill(0xffffff) // eye
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
    if (renderer) {
      const texture = renderer.generateTexture(g)
      g.destroy()
      return texture
    }
    // No renderer available — return empty texture (will be replaced after init)
    const texture = PIXI.Texture.EMPTY
    g.destroy()
    return texture
  }

  clear() {
    this.textures.clear()
    this.loaded = false
  }
}
