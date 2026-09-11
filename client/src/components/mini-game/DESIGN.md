# MIU-9 CHARACTER REDESIGN — Architecture Audit

## Current Architecture

```
Game Loop (miu9-future-run.tsx)
    ↓
Input Refs (jumpQueued, ducking, shootRequested)
    ↓
updateGameState(gs, dt, input)  ← PURE LOGIC, NO RENDERING
    ↓
GameState (positions, velocities, collisions, scoring)
    ↓
PixiRenderer.update(gs, dt)  ← PURE VISUAL, NO GAME LOGIC
    ├── ParallaxCity.update()  ← background
    ├── renderPlayer(gs)       ← player character
    ├── syncEnemies(gs)        ← enemy characters
    ├── syncLasers(gs)         ← player lasers
    ├── syncEnemyLasers(gs)    ← enemy lasers
    ├── syncParticles(gs)      ← particle effects
    └── syncFloatingTexts(gs)  ← score popups
```

## Files

| File | Role | Modify? |
|------|------|---------|
| `game-state.ts` | Pure game logic, constants, collision | **NO** |
| `pixi-renderer.ts` | All visual rendering | **YES** |
| `miu9-future-run.tsx` | React component, game loop, HUD | **NO** |
| `parallax-city.ts` | Background parallax | **NO** |
| `particle-pool.ts` | Particle object pool | **NO** |
| `mobile-controls.tsx` | Touch controls | **NO** |

## Rendering Dependency Map

### Player Rendering (`renderPlayer`)
- Reads: `gs.playerY`, `gs.isDucking`, `gs.isJumping`, `gs.invTimer`
- Uses constants: `PLAYER_X`, `PLAYER_W`, `PLAYER_H`, `PLAYER_DUCK_H`
- Draws with `PIXI.Graphics` procedural shapes
- Uses `GlowFilter` for pink emissive glow
- **COLLISION:** Uses same constants (PLAYER_X, PLAYER_W, PLAYER_H) — do NOT change these

### Enemy Rendering (`drawEnemy`)
- Reads: `o.x`, `o.y`, `o.w`, `o.h`, `o.flash`, `o.isCharging`, `o.chargeTriggered`, `elapsed`
- Robot: orange robot body
- Bird: cyberpunk fighter jet (swept wings, cockpit, engine)
- Mouse: red robot mouse with laser sword
- **COLLISION:** Uses `o.x`, `o.y`, `o.w`, `o.h` from GameState — do NOT change these

### Laser Rendering
- Player laser: cyan rectangle (LASER_W × LASER_H)
- Enemy laser: red rectangle (ENEMY_LASER_W × ENEMY_LASER_H)
- Muzzle flash: cyan circle

## Proposed Renderer Architecture

Replace procedural `PIXI.Graphics` shapes with enhanced Graphics that look premium:
- Same `PIXI.Graphics` API (no sprites needed for this scale)
- Enhanced with more layers, gradients, glow effects
- Same coordinate system, same hitbox constants

## Gameplay Invariants (DO NOT CHANGE)

- `PLAYER_X = 120`, `PLAYER_W = 48`, `PLAYER_H = 52`, `PLAYER_DUCK_H = 30`
- `ROBOT_W = 44`, `ROBOT_H = 48`
- `BIRD_W = 52`, `BIRD_H = 40`
- `MOUSE_W = 48`, `MOUSE_H = 44`
- `LASER_W = 50`, `LASER_H = 6`
- `ENEMY_LASER_W = 24`, `ENEMY_LASER_H = 4`
- `SHOOT_COOLDOWN = 500ms` (note: currently 750 in code, but prompt says 500)
- AABB collision detection
- Jump physics: JUMP_VEL=-580, GRAVITY=1400
- All spawning, scoring, lives, invincibility logic

## Palette

```
#FF6FC4  — pink (player body)
#F9A8D4  — light pink (inner ears, highlights)
#9D174D  — dark pink (nose)
#4DE8FF  — cyan (eyes, lasers, glow)
#0891B2  — dark cyan
#B98BFF  — purple (neon accents)
#FFD24D  — yellow (warning)
#EF4444  — red (damage, enemy lasers)
#0A0E1F  — dark navy (background)
#05070D  — darkest navy
```

## Migration Plan

1. Enhance `renderPlayer()` — pink cat cyberpunk character
2. Enhance `drawEnemy()` bird — futuristic robotic bird
3. Enhance `drawEnemy()` mouse — cyber robot mouse
4. Verify TypeScript + build
5. Runtime smoke test
6. Visual QA at multiple resolutions
