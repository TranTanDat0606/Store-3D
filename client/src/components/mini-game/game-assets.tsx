import { cn } from '@/lib'

interface AssetProps {
  className?: string
  style?: React.CSSProperties
}

export function PlayerFrog({ className, style }: AssetProps) {
  return (
    <div className={cn('relative select-none', className)} style={style}>
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <defs>
          <linearGradient id="frogBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <filter id="frogGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Body */}
        <rect x="12" y="18" width="24" height="22" rx="6" fill="url(#frogBody)" stroke="#166534" strokeWidth="1.5" />
        {/* Head */}
        <rect x="10" y="8" width="28" height="16" rx="8" fill="url(#frogBody)" stroke="#166534" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="18" cy="14" r="4" fill="#0e7490" filter="url(#frogGlow)" />
        <circle cx="30" cy="14" r="4" fill="#0e7490" filter="url(#frogGlow)" />
        <circle cx="18" cy="14" r="2" fill="#ecfeff" />
        <circle cx="30" cy="14" r="2" fill="#ecfeff" />
        {/* Mouth */}
        <path d="M18 20 Q24 24 30 20" stroke="#166534" strokeWidth="1.5" fill="none" />
        {/* Legs */}
        <rect x="14" y="38" width="8" height="6" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <rect x="26" y="38" width="8" height="6" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1" />
        {/* Arm cannon */}
        <rect x="34" y="22" width="10" height="6" rx="2" fill="#0e7490" stroke="#065f46" strokeWidth="1" />
        <circle cx="44" cy="25" r="3" fill="#22d3ee" opacity="0.8" />
      </svg>
    </div>
  )
}

export function PlayerFrogJump({ className, style }: AssetProps) {
  return (
    <div className={cn('relative select-none', className)} style={style}>
      <svg viewBox="0 0 48 52" width="100%" height="100%">
        <defs>
          <linearGradient id="frogBodyJ" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <filter id="frogGlowJ">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="12" y="14" width="24" height="22" rx="6" fill="url(#frogBodyJ)" stroke="#166534" strokeWidth="1.5" />
        <rect x="10" y="4" width="28" height="16" rx="8" fill="url(#frogBodyJ)" stroke="#166534" strokeWidth="1.5" />
        <circle cx="18" cy="10" r="4" fill="#0e7490" filter="url(#frogGlowJ)" />
        <circle cx="30" cy="10" r="4" fill="#0e7490" filter="url(#frogGlowJ)" />
        <circle cx="18" cy="10" r="2" fill="#ecfeff" />
        <circle cx="30" cy="10" r="2" fill="#ecfeff" />
        <path d="M18 16 Q24 20 30 16" stroke="#166534" strokeWidth="1.5" fill="none" />
        {/* Legs extended down */}
        <rect x="12" y="34" width="8" height="8" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <rect x="28" y="34" width="8" height="8" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <rect x="34" y="18" width="10" height="6" rx="2" fill="#0e7490" stroke="#065f46" strokeWidth="1" />
        <circle cx="44" cy="21" r="3" fill="#22d3ee" opacity="0.8" />
      </svg>
    </div>
  )
}

export function PlayerFrogCrouch({ className, style }: AssetProps) {
  return (
    <div className={cn('relative select-none', className)} style={style}>
      <svg viewBox="0 0 48 36" width="100%" height="100%">
        <defs>
          <linearGradient id="frogBodyC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <filter id="frogGlowC">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="8" y="14" width="32" height="16" rx="6" fill="url(#frogBodyC)" stroke="#166534" strokeWidth="1.5" />
        <rect x="10" y="6" width="28" height="14" rx="7" fill="url(#frogBodyC)" stroke="#166534" strokeWidth="1.5" />
        <circle cx="18" cy="12" r="3.5" fill="#0e7490" filter="url(#frogGlowC)" />
        <circle cx="30" cy="12" r="3.5" fill="#0e7490" filter="url(#frogGlowC)" />
        <circle cx="18" cy="12" r="1.8" fill="#ecfeff" />
        <circle cx="30" cy="12" r="1.8" fill="#ecfeff" />
        <rect x="12" y="28" width="10" height="5" rx="2.5" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <rect x="26" y="28" width="10" height="5" rx="2.5" fill="#15803d" stroke="#166534" strokeWidth="1" />
        <rect x="34" y="16" width="10" height="6" rx="2" fill="#0e7490" stroke="#065f46" strokeWidth="1" />
        <circle cx="44" cy="19" r="3" fill="#22d3ee" opacity="0.8" />
      </svg>
    </div>
  )
}

export function EnemyRobot({ className, style, variant = 'normal' }: AssetProps & { variant?: 'normal' | 'fast' | 'tank' }) {
  const colors = {
    normal: { body: '#dc2626', dark: '#991b1b', eye: '#fbbf24' },
    fast: { body: '#f97316', dark: '#c2410c', eye: '#fde047' },
    tank: { body: '#7c3aed', dark: '#5b21b6', eye: '#f87171' },
  }
  const c = colors[variant]
  return (
    <div className={cn('relative select-none', className)} style={style}>
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        <defs>
          <linearGradient id={`enemyBody-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.body} />
            <stop offset="100%" stopColor={c.dark} />
          </linearGradient>
          <filter id={`enemyGlow-${variant}`}>
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Body */}
        <rect x="8" y="10" width="24" height="22" rx="4" fill={`url(#enemyBody-${variant})`} stroke={c.dark} strokeWidth="1.5" />
        {/* Head */}
        <rect x="10" y="2" width="20" height="14" rx="4" fill={`url(#enemyBody-${variant})`} stroke={c.dark} strokeWidth="1.5" />
        {/* Eyes */}
        <rect x="14" y="6" width="5" height="4" rx="1" fill={c.eye} filter={`url(#enemyGlow-${variant})`} />
        <rect x="21" y="6" width="5" height="4" rx="1" fill={c.eye} filter={`url(#enemyGlow-${variant})`} />
        {/* Antenna */}
        <line x1="20" y1="2" x2="20" y2="-2" stroke={c.dark} strokeWidth="1.5" />
        <circle cx="20" cy="-3" r="1.5" fill={c.eye} />
        {/* Legs */}
        <rect x="10" y="30" width="6" height="6" rx="2" fill={c.dark} />
        <rect x="24" y="30" width="6" height="6" rx="2" fill={c.dark} />
        {/* Arm weapon */}
        <rect x="2" y="16" width="8" height="4" rx="2" fill={c.dark} stroke={c.body} strokeWidth="0.5" />
        <circle cx="2" cy="18" r="2" fill={c.eye} opacity="0.8" />
      </svg>
    </div>
  )
}

export function BossFrog({ className, style, phase = 1 }: AssetProps & { phase?: 1 | 2 }) {
  const isP2 = phase === 2
  return (
    <div className={cn('relative select-none', className)} style={style}>
      <svg viewBox="0 0 80 80" width="100%" height="100%">
        <defs>
          <linearGradient id="bossBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isP2 ? '#dc2626' : '#374151'} />
            <stop offset="100%" stopColor={isP2 ? '#991b1b' : '#1f2937'} />
          </linearGradient>
          <filter id="bossGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lavaGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Body */}
        <rect x="18" y="28" width="44" height="36" rx="10" fill="url(#bossBody)" stroke={isP2 ? '#b91c1c' : '#111827'} strokeWidth="2" />
        {/* Lava cracks for P2 */}
        {isP2 && (
          <>
            <path d="M25 35 L30 45 L28 55" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.8" filter="url(#lavaGlow)" />
            <path d="M50 32 L48 42 L52 52" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.7" filter="url(#lavaGlow)" />
            <path d="M35 58 L40 62 L45 58" stroke="#f97316" strokeWidth="1.5" fill="none" opacity="0.6" />
          </>
        )}
        {/* Head */}
        <rect x="14" y="8" width="52" height="28" rx="14" fill="url(#bossBody)" stroke={isP2 ? '#b91c1c' : '#111827'} strokeWidth="2" />
        {/* Eyes */}
        <circle cx="28" cy="20" r="7" fill={isP2 ? '#f97316' : '#0e7490'} filter="url(#bossGlow)" />
        <circle cx="52" cy="20" r="7" fill={isP2 ? '#f97316' : '#0e7490'} filter="url(#bossGlow)" />
        <circle cx="28" cy="20" r="3.5" fill={isP2 ? '#fef08a' : '#ecfeff'} />
        <circle cx="52" cy="20" r="3.5" fill={isP2 ? '#fef08a' : '#ecfeff'} />
        {/* Mouth */}
        <path d="M28 32 Q40 40 52 32" stroke={isP2 ? '#f97316' : '#0e7490'} strokeWidth="2" fill="none" />
        {/* Tongue/Lip */}
        {isP2 && <path d="M28 32 Q40 38 52 32" fill="#dc2626" opacity="0.5" />}
        {/* Legs */}
        <rect x="22" y="62" width="12" height="10" rx="4" fill={isP2 ? '#b91c1c' : '#1f2937'} stroke={isP2 ? '#991b1b' : '#111827'} strokeWidth="1.5" />
        <rect x="46" y="62" width="12" height="10" rx="4" fill={isP2 ? '#b91c1c' : '#1f2937'} stroke={isP2 ? '#991b1b' : '#111827'} strokeWidth="1.5" />
        {/* Arm cannons */}
        <rect x="2" y="34" width="18" height="8" rx="3" fill={isP2 ? '#991b1b' : '#374151'} stroke={isP2 ? '#7f1d1d' : '#111827'} strokeWidth="1.5" />
        <circle cx="2" cy="38" r="4" fill={isP2 ? '#f97316' : '#22d3ee'} opacity="0.9" filter="url(#bossGlow)" />
        <rect x="60" y="34" width="18" height="8" rx="3" fill={isP2 ? '#991b1b' : '#374151'} stroke={isP2 ? '#7f1d1d' : '#111827'} strokeWidth="1.5" />
        <circle cx="78" cy="38" r="4" fill={isP2 ? '#f97316' : '#22d3ee'} opacity="0.9" filter="url(#bossGlow)" />
      </svg>
    </div>
  )
}

export function EnergyBeam({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 24 8" width="100%" height="100%">
        <defs>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="beamGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="2" width="24" height="4" rx="2" fill="url(#beamGrad)" filter="url(#beamGlow)" />
        <rect x="4" y="3" width="16" height="2" rx="1" fill="#ecfeff" opacity="0.9" />
      </svg>
    </div>
  )
}

export function EnemyLaser({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 20 6" width="100%" height="100%">
        <defs>
          <linearGradient id="laserGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <filter id="laserGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="1" width="20" height="4" rx="2" fill="url(#laserGrad)" filter="url(#laserGlow)" />
        <rect x="4" y="2" width="12" height="2" rx="1" fill="#fca5a5" opacity="0.9" />
      </svg>
    </div>
  )
}

export function AcidBlob({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 16 16" width="100%" height="100%">
        <defs>
          <radialGradient id="acidGrad">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="70%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </radialGradient>
          <filter id="acidGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="8" cy="8" rx="6" ry="5" fill="url(#acidGrad)" filter="url(#acidGlow)" />
        <ellipse cx="7" cy="7" rx="2" ry="1.5" fill="#ccfbf1" opacity="0.6" />
      </svg>
    </div>
  )
}

export function LavaSpit({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 18 18" width="100%" height="100%">
        <defs>
          <radialGradient id="lavaGrad">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>
          <filter id="lavaGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="9" cy="9" r="7" fill="url(#lavaGrad)" filter="url(#lavaGlow)" />
        <circle cx="7" cy="7" r="2" fill="#fef08a" opacity="0.7" />
      </svg>
    </div>
  )
}

export function EyeLaserBeam({ className, style, phase = 1 }: AssetProps & { phase?: 1 | 2 }) {
  const isP2 = phase === 2
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 60 8" width="100%" height="100%">
        <defs>
          <linearGradient id="eyeLaserGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor={isP2 ? '#f97316' : '#0e7490'} stopOpacity="0.2" />
            <stop offset="30%" stopColor={isP2 ? '#f97316' : '#0e7490'} />
            <stop offset="100%" stopColor={isP2 ? '#dc2626' : '#06b6d4'} stopOpacity="0.4" />
          </linearGradient>
          <filter id="eyeLaserGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="1" width="60" height="6" rx="3" fill="url(#eyeLaserGrad)" filter="url(#eyeLaserGlow)" />
        <rect x="10" y="3" width="40" height="2" rx="1" fill={isP2 ? '#fef08a' : '#ecfeff'} opacity="0.8" />
      </svg>
    </div>
  )
}

export function Rocket({ className, style, direction = 'left' }: AssetProps & { direction?: 'left' | 'right' }) {
  const flip = direction === 'right' ? 'scaleX(-1)' : 'none'
  return (
    <div className={cn('select-none', className)} style={{ ...style, transform: `${style?.transform || ''} ${flip}`.trim() }}>
      <svg viewBox="0 0 32 14" width="100%" height="100%">
        <defs>
          <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
        <polygon points="0,7 8,0 8,14" fill="#ef4444" />
        <rect x="8" y="2" width="16" height="10" rx="2" fill="url(#rocketBody)" stroke="#9ca3af" strokeWidth="0.5" />
        <rect x="20" y="0" width="8" height="4" rx="1" fill="#6b7280" />
        <rect x="20" y="10" width="8" height="4" rx="1" fill="#6b7280" />
        {/* Flame */}
        <polygon points="24,4 32,7 24,10" fill="#f97316" opacity="0.9" />
        <polygon points="26,5 30,7 26,9" fill="#fde047" opacity="0.8" />
      </svg>
    </div>
  )
}

export function RollingRock({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 28 28" width="100%" height="100%">
        <defs>
          <radialGradient id="rockGrad">
            <stop offset="0%" stopColor="#a8a29e" />
            <stop offset="70%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#57534e" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="url(#rockGrad)" stroke="#44403c" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="3" fill="#a8a29e" opacity="0.4" />
        <circle cx="17" cy="16" r="2" fill="#78716c" opacity="0.3" />
        <path d="M8 14 L12 12 L16 15 L20 11" stroke="#57534e" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>
    </div>
  )
}

export function HealingHeart({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none animate-pulse', className)} style={style}>
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <defs>
          <filter id="heartGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="#22c55e"
          filter="url(#heartGlow)"
        />
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="none"
          stroke="#16a34a"
          strokeWidth="0.5"
        />
        <path d="M9 8 Q9 6 11 6" stroke="#dcfce7" strokeWidth="1" fill="none" opacity="0.6" />
      </svg>
    </div>
  )
}

export function Explosion({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 32 32" width="100%" height="100%">
        <defs>
          <radialGradient id="explosionGrad">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </radialGradient>
          <filter id="explosionGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#explosionGrad)" filter="url(#explosionGlow)" opacity="0.8" />
        <circle cx="16" cy="16" r="6" fill="#fef08a" opacity="0.9" />
        <circle cx="12" cy="10" r="3" fill="#fbbf24" opacity="0.6" />
        <circle cx="22" cy="12" r="2.5" fill="#f97316" opacity="0.5" />
        <circle cx="14" cy="22" r="2" fill="#fbbf24" opacity="0.4" />
      </svg>
    </div>
  )
}

export function HitSpark({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none', className)} style={style}>
      <svg viewBox="0 0 20 20" width="100%" height="100%">
        <defs>
          <filter id="sparkGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="10" cy="10" r="4" fill="#fde047" filter="url(#sparkGlow)" />
        <circle cx="10" cy="10" r="2" fill="#fef08a" />
        <line x1="10" y1="2" x2="10" y2="6" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="10" y1="14" x2="10" y2="18" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="2" y1="10" x2="6" y2="10" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="14" y1="10" x2="18" y2="10" stroke="#fbbf24" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

export function WarningIndicator({ className, style }: AssetProps) {
  return (
    <div className={cn('select-none animate-pulse', className)} style={style}>
      <svg viewBox="0 0 20 16" width="100%" height="100%">
        <polygon points="10,0 20,16 0,16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
        <text x="10" y="13" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">!</text>
      </svg>
    </div>
  )
}

export function BossHealthBar({ hp, maxHp, phase }: { hp: number; maxHp: number; phase: 1 | 2 }) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  const isP2 = phase === 2
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">
          {isP2 ? 'BOSS - VOLCANIC FORM' : 'BOSS'}
        </span>
        <span className="text-[10px] font-bold text-white/60">
          {Math.ceil(hp)}/{maxHp}
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/20 bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: isP2
              ? 'linear-gradient(90deg, #dc2626, #f97316, #fbbf24)'
              : 'linear-gradient(90deg, #0e7490, #22d3ee, #67e8f9)',
            boxShadow: isP2
              ? '0 0 12px rgba(249,115,22,0.6)'
              : '0 0 12px rgba(34,211,238,0.6)',
          }}
        />
      </div>
    </div>
  )
}
