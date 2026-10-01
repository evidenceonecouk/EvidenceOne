import { ChevronsLeft, ChevronsRight, ScanFace } from 'lucide-react'
import { useId } from 'react'
import { PortraitFigure } from '@/components/visual/Portrait'
import type { PortraitLook } from '@/data/portraits'
import { cn } from '@/lib/utils'
import { CAMERA_OK, CAMERA_WARN } from './camera'
import type { Beat, Tone } from './liveness'

const ringColour: Record<Tone, string> = {
  idle: 'rgb(255 255 255 / 0.55)',
  warn: CAMERA_WARN,
  ok: CAMERA_OK,
  rec: 'rgb(255 255 255 / 0.18)',
}

/* Oval guide in the 320 x 352 camera box. The arc path starts at the top. */
const OVAL = { cx: 160, cy: 158, rx: 100, ry: 128 }
const ARC = `M${OVAL.cx} ${OVAL.cy - OVAL.ry} A${OVAL.rx} ${OVAL.ry} 0 0 1 ${OVAL.cx} ${OVAL.cy + OVAL.ry} A${OVAL.rx} ${OVAL.ry} 0 0 1 ${OVAL.cx} ${OVAL.cy - OVAL.ry}`

/*
  The front camera view: an illustrated person in a room with a ceiling light,
  inside the oval guide. Before the scan starts the camera is off.
*/
export function LivenessCamera({
  look,
  beat,
}: {
  look: PortraitLook
  beat: Beat | undefined
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const on = !!beat
  const isDark = !!beat?.dark
  const tone = beat?.ring ?? 'idle'
  const progress = beat?.progress ?? 0
  const Pill = beat?.pill

  return (
    <div
      aria-hidden="true"
      className="relative mt-5 aspect-[320/352] shrink-0 overflow-hidden rounded-3xl bg-[#0d0e10]"
    >
      <svg viewBox="0 0 320 352" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id={`${uid}-wall`} cx="0.35" cy="0.25" r="0.9">
            <stop offset="0" stopColor="#4a4d52" />
            <stop offset="1" stopColor="#1c1d20" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor="#fff2cf" stopOpacity="0.7" />
            <stop offset="0.25" stopColor="#fff2cf" stopOpacity="0.22" />
            <stop offset="1" stopColor="#fff2cf" stopOpacity="0" />
          </radialGradient>
          <mask id={`${uid}-outside`}>
            <rect width="320" height="352" fill="#ffffff" />
            <ellipse
              cx={OVAL.cx}
              cy={OVAL.cy}
              rx={OVAL.rx}
              ry={OVAL.ry}
              fill="#000000"
            />
          </mask>
        </defs>

        {/* The room */}
        <rect width="320" height="352" fill={`url(#${uid}-wall)`} />
        <rect
          x="18"
          y="58"
          width="50"
          height="64"
          rx="2"
          fill="#ffffff"
          fillOpacity="0.04"
          stroke="#ffffff"
          strokeOpacity="0.1"
        />
        <rect
          x="26"
          y="66"
          width="34"
          height="48"
          fill="#ffffff"
          fillOpacity="0.05"
        />
        <path d="M0 296 H320" stroke="#ffffff" strokeOpacity="0.05" />
        <line
          x1="270"
          y1="0"
          x2="270"
          y2="30"
          stroke="#0b0c0d"
          strokeWidth="1.5"
        />
        <path d="M252 52 L288 52 L280 30 L260 30 Z" fill="#2c2e32" />
        <ellipse
          cx="270"
          cy="53"
          rx="11"
          ry="3.4"
          fill={isDark ? '#3a3c40' : '#fff6dc'}
          style={{ transition: 'fill 160ms' }}
        />
        <circle
          cx="270"
          cy="62"
          r="150"
          fill={`url(#${uid}-glow)`}
          opacity={isDark ? 0 : 1}
          style={{ transition: `opacity ${isDark ? 400 : 160}ms ease-out` }}
        />

        {/* The person, breathing gently */}
        <g transform="translate(10 -16) scale(1.5)">
          <g className="animate-breathe">
            <PortraitFigure
              look={look}
              pose={beat?.pose ?? { glasses: true }}
            />
          </g>
        </g>

        {/* Low light: the picture darkens and gets noisy until the light is turned on */}
        <rect
          width="320"
          height="352"
          fill="#05060a"
          opacity={isDark ? 0.74 : 0}
          style={{ transition: `opacity ${isDark ? 600 : 180}ms ease-out` }}
        />

        {/* Dim everything outside the oval */}
        <rect
          width="320"
          height="352"
          fill="#0b0c0e"
          opacity="0.45"
          mask={`url(#${uid}-outside)`}
        />

        {/* Camera off until the scan starts */}
        <rect
          width="320"
          height="352"
          fill="#0d0e10"
          opacity={on ? 0 : 1}
          style={{ transition: 'opacity 700ms ease-out' }}
        />

        {/* Oval guide: colour shows the state, the arc shows recording progress */}
        <ellipse
          cx={OVAL.cx}
          cy={OVAL.cy}
          rx={OVAL.rx}
          ry={OVAL.ry}
          fill="none"
          stroke={ringColour[tone]}
          strokeWidth={tone === 'idle' ? 3 : 5}
          style={{ transition: 'stroke 300ms ease-out' }}
        />
        {tone === 'ok' && (
          <ellipse
            key={beat?.prompt}
            className="animate-ring-pop"
            cx={OVAL.cx}
            cy={OVAL.cy}
            rx={OVAL.rx}
            ry={OVAL.ry}
            fill="none"
            stroke={CAMERA_OK}
          />
        )}
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          stroke={CAMERA_OK}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="100 100"
          style={{
            strokeDashoffset: 100 - progress,
            transition: `stroke-dashoffset ${beat?.ms || 300}ms linear`,
            opacity: progress > 0 ? 1 : 0,
          }}
        />
      </svg>

      <div
        className={cn(
          'grain pointer-events-none absolute inset-0 transition-opacity duration-500',
          isDark ? 'opacity-100' : 'opacity-0',
        )}
      />
      {beat?.lightOn && (
        <div className="animate-shutter pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_85%_10%,rgb(255_242_207/0.55),transparent_70%)]" />
      )}

      {!on && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ScanFace className="size-16 text-white/35" strokeWidth={1.25} />
        </div>
      )}

      {/* Direction cue while a head turn is asked for */}
      {!!beat?.pose.yaw && (
        <span
          key={beat.pose.yaw}
          className={cn(
            'animate-rise absolute top-1/2 -translate-y-1/2 text-white [animation-duration:280ms]',
            beat.pose.yaw < 0 ? 'left-2' : 'right-2',
          )}
        >
          {beat.pose.yaw < 0 ? (
            <ChevronsLeft
              className="animate-nudge-left size-9"
              strokeWidth={2.25}
            />
          ) : (
            <ChevronsRight
              className="animate-nudge-right size-9"
              strokeWidth={2.25}
            />
          )}
        </span>
      )}

      {Pill && (
        <span
          key={Pill.text}
          className={cn(
            'animate-rise absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.875rem] font-medium whitespace-nowrap [animation-duration:280ms]',
            Pill.tone === 'rec' ? 'bg-black/60 text-white' : 'text-ink',
          )}
          style={
            Pill.tone === 'rec'
              ? undefined
              : { background: Pill.tone === 'ok' ? CAMERA_OK : CAMERA_WARN }
          }
        >
          {Pill.tone === 'rec' ? (
            <span className="size-2 animate-pulse rounded-full bg-[#ff5a4f]" />
          ) : (
            <Pill.icon className="size-4" strokeWidth={2.25} />
          )}
          {Pill.text}
        </span>
      )}
    </div>
  )
}
