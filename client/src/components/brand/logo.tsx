import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * STORE 3D brand logo — exact vector data extracted from the approved Stitch
 * design `.stitch/designs/logo-system.html` (no redrawing, no rasterization).
 *
 * Rendering approach: INLINE SVG (not <img src>). Rationale per Plan 2 T2:
 * the gold mark uses three linearGradient defs referenced via url(#…); with
 * <img> every instance would share document-global gradient ids. Inline lets
 * us namespace gradient ids per component instance via React's useId(), so
 * multiple <Logo> instances (navbar, footer, admin sidebar, 404 page…) can
 * never collide. The wordmark is HTML text (Orbitron) exactly as the design
 * composes it — the design itself sets "STORE 3D" as styled text, not paths.
 *
 * Source vectors (byte-faithful coordinates):
 * - mark:  Primary Lockup monogram (3 gradient facets + 3 obsidian core lines)
 * - mono:  Pure White Monochrome variant (white facets, opacity-stepped)
 * - lockup: Primary Lockup icon + Orbitron wordmark + subline, per Mục 01
 */

export type LogoVariant = 'mark' | 'lockup' | 'mono'

interface LogoProps {
  variant: LogoVariant
  className?: string
  /** Accessible label; pass "" to mark the logo decorative (aria-hidden). */
  alt?: string
}

/** Gold wordmark gradient from the design (primary-fixed → primary → primary-container). */
const WORDMARK_GRADIENT = 'linear-gradient(90deg, #FFDEA5 0%, #FFD78D 50%, #EDB84C 100%)'

function MarkGlyph({ uid, className }: { uid: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id={`${uid}-grad-top`} x1="50" y1="12" x2="50" y2="48">
          <stop offset="0%" stopColor="#FFDEA5" />
          <stop offset="100%" stopColor="#EDB84C" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={`${uid}-grad-left`} x1="16" y1="48" x2="50" y2="88">
          <stop offset="0%" stopColor="#EDB84C" />
          <stop offset="100%" stopColor="#9B731D" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={`${uid}-grad-right`} x1="50" y1="48" x2="84" y2="88">
          <stop offset="0%" stopColor="#D49E35" />
          <stop offset="100%" stopColor="#5D4200" />
        </linearGradient>
      </defs>
      {/* Top Face Isometric */}
      <polygon
        fill={`url(#${uid}-grad-top)`}
        points="50,14 84,33 50,52 16,33"
        stroke="#FFDEA5"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* Left Face Isometric with 3D Layer Slices */}
      <polygon
        fill={`url(#${uid}-grad-left)`}
        points="16,35 50,54 50,86 16,67"
        stroke="#EDB84C"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* Right Face Isometric with Cutout Tech lines */}
      <polygon
        fill={`url(#${uid}-grad-right)`}
        points="50,54 84,35 84,67 50,86"
        stroke="#EDB84C"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {/* Central 3D Core-Line Slice */}
      <line stroke="#07090F" strokeLinecap="round" strokeWidth="2.5" x1="50" y1="20" x2="50" y2="46" />
      <line stroke="#07090F" strokeLinecap="round" strokeWidth="2.5" x1="28" y1="47" x2="50" y2="60" />
      <line stroke="#07090F" strokeLinecap="round" strokeWidth="2.5" x1="72" y1="47" x2="50" y2="60" />
    </svg>
  )
}

function MonoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      <polygon fill="#FFFFFF" fillOpacity="0.9" points="50,14 84,33 50,52 16,33" stroke="#FFFFFF" strokeWidth="1.5" />
      <polygon fill="#FFFFFF" fillOpacity="0.6" points="16,35 50,54 50,86 16,67" stroke="#FFFFFF" strokeWidth="1.5" />
      <polygon fill="#FFFFFF" fillOpacity="0.3" points="50,54 84,35 84,67 50,86" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  )
}

export function Logo({ variant, className, alt }: LogoProps) {
  const uid = useId()
  const decorative = alt === ''
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': alt ?? 'STORE 3D' }

  if (variant === 'mark') {
    return (
      <span {...a11y} className={cn('inline-flex', className)}>
        <MarkGlyph uid={uid} className="h-full w-full" />
      </span>
    )
  }

  if (variant === 'mono') {
    return (
      <span {...a11y} className={cn('inline-flex items-center gap-2.5', className)}>
        <MonoGlyph className="h-9 w-9" />
        <span
          className="text-lg font-black tracking-widest text-white leading-none"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          STORE 3D
        </span>
      </span>
    )
  }

  // Horizontal lockup (Mục 01): gradient monogram + gold-gradient Orbitron wordmark + subline
  return (
    <span {...a11y} className={cn('inline-flex items-center gap-3', className)}>
      <MarkGlyph uid={uid} className="h-11 w-11" />
      <span className="flex flex-col gap-1.5">
        <span
          className="text-transparent bg-clip-text text-2xl font-black tracking-widest leading-none"
          style={{ fontFamily: "'Orbitron', sans-serif", backgroundImage: WORDMARK_GRADIENT }}
        >
          STORE 3D
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-accent" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none">
            High-End 3D Collectibles
          </span>
          <span className="h-0.5 w-4 bg-accent" aria-hidden="true" />
        </span>
      </span>
    </span>
  )
}
