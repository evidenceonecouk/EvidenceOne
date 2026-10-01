import { useId, type CSSProperties } from 'react'
import type { HairStyle, PortraitLook } from '@/data/portraits'

/*
  Vector portrait of a fictional person, drawn in a 200 x 240 box. The same
  drawing is used on the specimen documents and in the selfie camera, so the
  face match in the demo is visibly the same person. Never a photograph.
*/
export interface Pose {
  /** Head turn: -1 is towards the viewer's left, 1 towards the viewer's right. */
  yaw?: number
  glasses?: boolean
  blink?: boolean
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const c = (s: number) =>
    Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t)
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`
}

const FACE =
  'M100 56 C127 56 144 76 144 104 C144 134 130 160 100 164 C70 160 56 134 56 104 C56 76 73 56 100 56 Z'
/** A narrower oval with a more defined chin. */
const FACE_SLIM =
  'M100 57 C125 57 141 77 141 104 C141 131 127 157 100 163 C73 157 59 131 59 104 C59 77 75 57 100 57 Z'

const hairBack: Partial<Record<HairStyle, string>> = {
  long: 'M100 40 C130 40 154 60 154 100 C154 140 158 176 166 214 C152 222 132 220 124 200 C120 186 118 170 116 160 L84 160 C82 170 80 186 76 200 C68 220 48 222 34 214 C42 176 46 140 46 100 C46 60 70 40 100 40 Z',
  bob: 'M100 42 C130 42 152 62 152 100 C152 124 154 144 156 158 C146 166 132 166 124 160 L116 150 L84 150 L76 160 C68 166 54 166 44 158 C46 144 48 124 48 100 C48 62 70 42 100 42 Z',
  lob: 'M100 40 C133 40 157 62 156 102 C155 130 159 158 167 182 C160 189 140 190 126 185 L116 158 L84 158 L74 185 C60 190 40 189 33 182 C41 158 45 130 44 102 C43 62 67 40 100 40 Z',
}

const hairFront: Record<HairStyle, string> = {
  crop: 'M57 100 C55 68 76 52 100 52 C124 52 145 68 143 100 C141 90 137 82 130 78 C120 74 110 73 100 73 C90 73 80 74 70 78 C63 82 59 90 57 100 Z',
  short:
    'M55 102 C51 66 74 46 102 47 C130 48 150 66 145 102 C143 90 139 82 133 77 C124 80 110 79 98 73 C88 79 74 82 64 84 C59 90 57 96 55 102 Z',
  bob: 'M55 104 C52 70 74 50 102 50 C128 50 147 68 145 104 C145 116 146 128 148 140 C140 126 138 108 132 92 C124 80 110 74 96 74 C82 78 68 88 60 104 C58 116 58 128 56 140 C54 128 54 116 55 104 Z',
  // Deep side parting: a narrow section on one side, a curtain swept across the forehead on the other
  lob: 'M56 150 C52 126 50 100 54 84 C58 62 78 48 102 48 C130 48 152 66 152 102 C152 132 156 160 162 184 C157 187 151 187 146 185 C141 160 139 132 135 112 C131 94 120 80 104 72 C96 68 90 66 86 66 C76 68 66 76 62 90 C59 104 58 126 56 150 Z',
  long: 'M100 50 C74 50 56 68 55 102 C54 118 56 132 58 144 C62 122 66 98 82 78 C90 70 96 64 100 62 C104 64 110 70 118 78 C134 98 138 122 142 144 C144 132 146 118 145 102 C144 68 126 50 100 50 Z',
  bun: 'M56 104 C54 68 76 50 100 50 C124 50 146 68 144 104 C141 88 130 76 116 72 C106 70 94 70 84 72 C70 76 59 88 56 104 Z',
}

const coversEars = (s: HairStyle) => s === 'long' || s === 'bob' || s === 'lob'

export function PortraitFigure({
  look,
  pose = {},
  animated = true,
}: {
  look: PortraitLook
  pose?: Pose
  animated?: boolean
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const y = Math.max(-1, Math.min(1, pose.yaw ?? 0))
  const ay = Math.abs(y)
  const shade = mix(look.skin, '#3a1d12', 0.28)
  const deep = mix(look.skin, '#2a140c', 0.45)
  const lip =
    look.lip ?? mix(look.skin, '#9c3d3a', look.sex === 'F' ? 0.5 : 0.32)
  const brow = mix(look.hair, '#1f1712', 0.4)
  const hair = look.hair
  const hairHi = mix(look.hair, '#ffffff', 0.18)
  const face = look.slimFace ? FACE_SLIM : FACE

  const move = (ms: number): CSSProperties | undefined =>
    animated
      ? {
          transition: `transform ${ms}ms cubic-bezier(0.45, 0, 0.2, 1), opacity ${ms}ms cubic-bezier(0.45, 0, 0.2, 1)`,
        }
      : undefined
  const at = (x: number, extra = '', ms = 1000): CSSProperties => ({
    transform: `translateX(${x}px)${extra}`,
    transformBox: 'fill-box',
    transformOrigin: 'center',
    ...move(ms),
  })

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-face`}>
          <path d={face} />
        </clipPath>
        <linearGradient id={`${uid}-shade-r`} x1="0" x2="1">
          <stop offset="0.35" stopColor={deep} stopOpacity="0" />
          <stop offset="1" stopColor={deep} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${uid}-shade-l`} x1="1" x2="0">
          <stop offset="0.35" stopColor={deep} stopOpacity="0" />
          <stop offset="1" stopColor={deep} stopOpacity="1" />
        </linearGradient>
        <radialGradient id={`${uid}-light`} cx="0.36" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-hair`} x1="0" x2="0.4" y1="0" y2="1">
          <stop offset="0" stopColor={hairHi} />
          <stop offset="0.5" stopColor={hair} />
          {look.hairEnds && <stop offset="1" stopColor={look.hairEnds} />}
        </linearGradient>
        <linearGradient id={`${uid}-hair-len`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.25" stopColor={hair} />
          <stop offset="1" stopColor={look.hairEnds ?? hair} />
        </linearGradient>
      </defs>

      {/* Shoulders */}
      <g style={at(y * 2)}>
        <path
          d="M24 240 C26 206 52 190 84 184 Q100 196 116 184 C148 190 174 206 176 240 Z"
          fill={look.top}
        />
        <path
          d="M84 184 Q100 197 116 184"
          fill="none"
          stroke={mix(look.top, '#000000', 0.3)}
          strokeWidth="2"
        />
      </g>

      {/* Hair behind the head */}
      {hairBack[look.style] && (
        <g style={at(-y * 6)}>
          <path d={hairBack[look.style]} fill={`url(#${uid}-hair-len)`} />
        </g>
      )}
      {look.style === 'bun' && (
        <g style={at(y * 5)}>
          <circle cx="100" cy="42" r="16" fill={`url(#${uid}-hair)`} />
        </g>
      )}

      {/* Neck */}
      <g style={at(y)}>
        <path d="M86 146 L86 186 Q100 197 114 186 L114 146 Z" fill={shade} />
        <ellipse cx="100" cy="160" rx="20" ry="9" fill={deep} opacity="0.35" />
      </g>

      {/* Ears */}
      {!coversEars(look.style) && (
        <>
          <g style={{ ...at(ay * 4), opacity: 1 - Math.max(0, -y) }}>
            <ellipse cx="57" cy="110" rx="6.5" ry="11" fill={look.skin} />
            <path
              d="M58.5 103.5 Q54 110 58.5 117"
              fill="none"
              stroke={shade}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
          <g style={{ ...at(-ay * 4), opacity: 1 - Math.max(0, y) }}>
            <ellipse cx="143" cy="110" rx="6.5" ry="11" fill={look.skin} />
            <path
              d="M141.5 103.5 Q146 110 141.5 117"
              fill="none"
              stroke={shade}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </>
      )}

      {/* Face, with light from the upper left and shade on the side turned away */}
      <g style={at(y * 4, ` scaleX(${1 - 0.05 * ay})`)}>
        <path d={face} fill={look.skin} />
        <g clipPath={`url(#${uid}-face)`}>
          <rect
            x="56"
            y="50"
            width="88"
            height="120"
            fill={`url(#${uid}-shade-r)`}
            opacity={0.22 + Math.max(0, y) * 0.4}
            style={move(1000)}
          />
          <rect
            x="56"
            y="50"
            width="88"
            height="120"
            fill={`url(#${uid}-shade-l)`}
            opacity={Math.max(0, -y) * 0.5}
            style={move(1000)}
          />
          <rect
            x="56"
            y="50"
            width="88"
            height="120"
            fill={`url(#${uid}-light)`}
          />
          {/* Cheeks move with the features but stay on the face */}
          <g style={at(y * 12)}>
            <ellipse
              cx="74"
              cy="127"
              rx="9"
              ry="5"
              fill="#e0806f"
              opacity={look.blush ?? 0.1}
            />
            <ellipse
              cx="126"
              cy="127"
              rx="9"
              ry="5"
              fill="#e0806f"
              opacity={look.blush ?? 0.1}
            />
            {look.freckles &&
              [
                [86, 121],
                [90, 124.5],
                [94, 121.5],
                [106, 121.5],
                [110, 124.5],
                [114, 121],
                [80, 125],
                [120, 125],
                [97.5, 117],
                [102.5, 117],
              ].map(([x, fy]) => (
                <circle
                  key={`${x}-${fy}`}
                  cx={x}
                  cy={fy}
                  r="0.75"
                  fill="#a8664c"
                  opacity="0.4"
                />
              ))}
          </g>
        </g>
      </g>

      {/* Beard */}
      {look.beard && (
        <g style={at(y * 10)} opacity="0.94">
          <path
            d="M58 112 C58 146 78 170 100 170 C122 170 142 146 142 112 C140 126 134 138 124 144 C116 148 108 147 100 147 C92 147 84 148 76 144 C66 138 60 126 58 112 Z"
            fill={hair}
          />
          <path
            d="M86 139 C92 134 98 135 100 136.5 C102 135 108 134 114 139 C108 140 104 139.5 100 140 C96 139.5 92 140 86 139 Z"
            fill={hair}
          />
        </g>
      )}

      {/* Features */}
      <g style={at(y * 17)}>
        {/* Brows */}
        <path
          d={
            look.sex === 'F'
              ? 'M71 95.5 Q79 88.5 91.5 92'
              : 'M70 95 Q80 89.5 92 93'
          }
          fill="none"
          stroke={brow}
          strokeWidth={look.sex === 'F' ? 2.3 : 2.9}
          strokeLinecap="round"
        />
        <path
          d={
            look.sex === 'F'
              ? 'M108.5 92 Q121 88.5 129 95.5'
              : 'M108 93 Q120 89.5 130 95'
          }
          fill="none"
          stroke={brow}
          strokeWidth={look.sex === 'F' ? 2.3 : 2.9}
          strokeLinecap="round"
        />
        {/* Eyes: a natural blink every few seconds, plus the instructed blink */}
        <g
          className={animated ? 'portrait-blink' : undefined}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g
            style={{
              transform: `scaleY(${pose.blink ? 0.08 : 1})`,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              ...(animated ? { transition: 'transform 90ms ease-out' } : null),
            }}
          >
            <Eye
              cx={81}
              side={-1}
              iris={look.iris}
              lashes={look.sex === 'F'}
              squash={Math.max(0, -y) * 0.35}
              animated={animated}
            />
            <Eye
              cx={119}
              side={1}
              iris={look.iris}
              lashes={look.sex === 'F'}
              squash={Math.max(0, y) * 0.35}
              animated={animated}
            />
          </g>
        </g>
      </g>

      {/* Nose sits furthest forward, so it moves most when the head turns */}
      <g style={at(y * 24)}>
        <path
          d="M98.5 104 C98 112 96.6 119 95.6 124"
          fill="none"
          stroke={deep}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.32"
        />
        <circle cx="100.5" cy="124.5" r="3.2" fill="#ffffff" opacity="0.1" />
        <ellipse
          cx="100"
          cy="131.2"
          rx="6"
          ry="1.6"
          fill={deep}
          opacity="0.2"
        />
        <path
          d="M93.5 127.5 C95 130.5 97.5 131 100 130 C102.5 131 105 130.5 106.5 127.5"
          fill="none"
          stroke={deep}
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Mouth */}
      <g style={at(y * 15, ` scaleX(${1 - 0.12 * ay})`)}>
        <path
          d="M88 142 Q94 138 100 140.2 Q106 138 112 142 Q100 143.5 88 142 Z"
          fill={mix(lip, '#000000', 0.18)}
        />
        <path
          d="M88 142 Q100 143.5 112 142 Q107 149 100 149 Q93 149 88 142 Z"
          fill={lip}
        />
        <path
          d="M95 145.5 Q100 146.6 105 145.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Hair in front */}
      <g style={at(y * 8)}>
        <path d={hairFront[look.style]} fill={`url(#${uid}-hair)`} />
        {look.style === 'lob' && (
          <g fill="none" strokeLinecap="round">
            <path
              d="M86 66 C87 60 89 54 92 49"
              stroke={mix(hair, '#000000', 0.25)}
              strokeWidth="1.4"
              opacity="0.6"
            />
            <g stroke={look.hairEnds ?? hairHi} opacity="0.55">
              <path
                d="M96 53 C124 53 145 71 146 108 C147 136 150 160 155 182"
                strokeWidth="1.6"
              />
              <path d="M104 61 C121 67 132 84 137 110" strokeWidth="1.2" />
              <path d="M80 56 C66 64 58 80 56 104" strokeWidth="1.2" />
            </g>
          </g>
        )}
      </g>

      {/* Glasses: lifted away when removed */}
      <g
        style={{
          transform: pose.glasses
            ? `translateX(${y * 17}px)`
            : `translate(${y * 17}px, -70px) rotate(-14deg)`,
          opacity: pose.glasses ? 1 : 0,
          transformBox: 'fill-box',
          transformOrigin: 'center',
          ...(animated
            ? {
                transition:
                  'transform 900ms cubic-bezier(0.5, 0, 0.2, 1), opacity 700ms ease-in 200ms',
              }
            : null),
        }}
      >
        <rect
          x="67.5"
          y="97.5"
          width="27"
          height="17.5"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.1"
          stroke="#1b1d20"
          strokeWidth="2.6"
        />
        <rect
          x="105.5"
          y="97.5"
          width="27"
          height="17.5"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.1"
          stroke="#1b1d20"
          strokeWidth="2.6"
        />
        <path
          d="M94.5 105 Q100 101.5 105.5 105"
          fill="none"
          stroke="#1b1d20"
          strokeWidth="2.4"
        />
        <path
          d="M67.5 103 L57 101 M132.5 103 L143 101"
          stroke="#1b1d20"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M72 112 L79.5 100.5 M110 112 L117.5 100.5"
          stroke="#ffffff"
          strokeOpacity="0.4"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </g>
  )
}

function Eye({
  cx,
  side,
  iris,
  lashes,
  squash,
  animated,
}: {
  cx: number
  side: 1 | -1
  iris: string
  lashes: boolean
  squash: number
  animated: boolean
}) {
  return (
    <g
      style={{
        transform: `scaleX(${1 - squash})`,
        transformBox: 'fill-box',
        transformOrigin: 'center',
        ...(animated
          ? { transition: 'transform 1000ms cubic-bezier(0.45, 0, 0.2, 1)' }
          : null),
      }}
    >
      <path
        d={`M${cx - 10} 106 Q${cx} 99 ${cx + 10} 106 Q${cx} 111 ${cx - 10} 106 Z`}
        fill="#f5f2ee"
      />
      <circle cx={cx} cy="105.6" r="3.7" fill={iris} />
      <circle cx={cx} cy="105.6" r="1.7" fill="#0d0d0d" />
      <circle cx={cx + 1.3} cy="104.3" r="0.9" fill="#ffffff" />
      <path
        d={`M${cx - 10.5} 106 Q${cx} 98.5 ${cx + 10.5} 105.5`}
        fill="none"
        stroke="#231a15"
        strokeWidth={lashes ? 2.3 : 1.8}
        strokeLinecap="round"
      />
      {lashes && (
        <path
          d={`M${cx + side * 10.2} 105.6 l${side * 2.6} -2.2`}
          fill="none"
          stroke="#231a15"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </g>
  )
}

/** A passport-style head and shoulders crop on a plain background. */
export function Portrait({
  look,
  className,
  background = '#e9ebed',
}: {
  look: PortraitLook
  className?: string
  background?: string
}) {
  return (
    <svg
      viewBox="28 28 144 185"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x="0" y="0" width="200" height="240" fill={background} />
      <PortraitFigure look={look} pose={{ glasses: false }} animated={false} />
    </svg>
  )
}
