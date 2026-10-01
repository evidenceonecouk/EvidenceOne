import { cn } from '@/lib/utils'

/*
  A synthetic, greyscale macro eye drawn in SVG, framed by scan brackets.
  It stands in for the client's hero photograph without using a real person's image.
*/

const ALMOND = 'M10 160 C 140 18, 460 18, 590 160 C 460 292, 140 292, 10 160 Z'

// Iris fibres: thin radial strokes with deterministic variation
const fibres = Array.from({ length: 180 }, (_, i) => {
  const a = (i / 180) * Math.PI * 2
  const jitter = ((i * 37) % 11) / 11
  const r1 = 34 + jitter * 6
  const r2 = 92 - ((i * 17) % 9)
  return {
    x1: 300 + Math.cos(a) * r1,
    y1: 160 + Math.sin(a) * r1,
    x2: 300 + Math.cos(a + 0.04) * r2,
    y2: 160 + Math.sin(a + 0.04) * r2,
    o: 0.12 + ((i * 29) % 7) / 28,
    light: i % 3 === 0,
  }
})

export function EyeVisual({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative overflow-hidden', className)}>
      {/* Skin and light */}
      <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_56%_48%,#dcdddd_0%,#bfc1c3_36%,#8f9295_70%,#5f6265_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(45%_35%_at_72%_18%,rgb(255_255_255/0.4),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply [background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)]" />

      <svg viewBox="0 0 600 320" className="absolute top-1/2 left-[56%] w-[88%] -translate-x-1/2 -translate-y-1/2">
        <defs>
          <clipPath id="eye-almond">
            <path d={ALMOND} />
          </clipPath>
          <radialGradient id="eye-sclera" cx="50%" cy="52%" r="60%">
            <stop offset="0" stopColor="#f4f4f3" />
            <stop offset="0.55" stopColor="#dededd" />
            <stop offset="0.85" stopColor="#adb0b2" />
            <stop offset="1" stopColor="#7d8083" />
          </radialGradient>
          <radialGradient id="eye-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#9a9ea1" />
            <stop offset="0.45" stopColor="#b9bdc0" />
            <stop offset="0.7" stopColor="#6b6f73" />
            <stop offset="0.9" stopColor="#36393c" />
            <stop offset="1" stopColor="#141516" />
          </radialGradient>
          <radialGradient id="eye-pupil-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0.55" stopColor="#0b0b0c" stopOpacity="0.7" />
            <stop offset="1" stopColor="#0b0b0c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eye-lid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2a2c2e" stopOpacity="0.75" />
            <stop offset="0.38" stopColor="#2a2c2e" stopOpacity="0" />
            <stop offset="0.85" stopColor="#2a2c2e" stopOpacity="0" />
            <stop offset="1" stopColor="#2a2c2e" stopOpacity="0.35" />
          </linearGradient>
          <filter id="eye-soft">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Lid crease and lower lid shading */}
        <path d="M30 120 C 170 -10, 440 -10, 575 125" fill="none" stroke="#4d5053" strokeOpacity="0.45" strokeWidth="5" filter="url(#eye-soft)" />
        <path d="M60 205 C 190 300, 420 300, 545 205" fill="none" stroke="#5a5d60" strokeOpacity="0.3" strokeWidth="4" filter="url(#eye-soft)" />

        <g clipPath="url(#eye-almond)">
          <rect width="600" height="320" fill="url(#eye-sclera)" />
          <circle cx="300" cy="160" r="100" fill="#121314" opacity="0.35" filter="url(#eye-soft)" />
          <circle cx="300" cy="160" r="94" fill="url(#eye-iris)" />
          {fibres.map((f, i) => (
            <line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={f.light ? '#e6e8ea' : '#1b1c1e'} strokeOpacity={f.o} strokeWidth="1.3" />
          ))}
          <circle cx="300" cy="160" r="94" fill="none" stroke="#0f1011" strokeOpacity="0.8" strokeWidth="7" />
          <circle cx="300" cy="160" r="48" fill="url(#eye-pupil-halo)" />
          <circle cx="300" cy="160" r="34" fill="#050506" />
          <ellipse cx="270" cy="128" rx="13" ry="10" fill="#ffffff" opacity="0.9" filter="url(#eye-soft)" />
          <circle cx="332" cy="190" r="4" fill="#ffffff" opacity="0.55" />
          <rect width="600" height="320" fill="url(#eye-lid)" />
        </g>
        <path d={ALMOND} fill="none" stroke="#3b3e41" strokeOpacity="0.55" strokeWidth="3" />
      </svg>

      {/* Scan brackets around the iris */}
      <div className="absolute top-1/2 left-[56%] aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2">
        {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => (
          <span key={c} className={cn('absolute size-[14%] border-white/90', c)} />
        ))}
        <span className="animate-scan absolute inset-x-[10%] top-[10%] h-px bg-white/75 shadow-[0_0_12px_2px_rgb(255_255_255/0.45)]" />
      </div>
    </div>
  )
}
