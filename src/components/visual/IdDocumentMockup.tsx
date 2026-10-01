import { useId, type ReactNode } from 'react'
import type { PortraitLook } from '@/data/portraits'
import {
  cardMrz,
  dottedDate,
  passportMrz,
  printedDate,
  type DocumentFacts,
} from '@/lib/idDocument'
import { cn } from '@/lib/utils'
import { PortraitFigure } from './Portrait'

/*
  Specimen identity documents for the capture screens. Generic layouts with no
  national emblems or issuer branding, overprinted SPECIMEN, filled with the
  fictional person's details. Decorative: the screen states what is happening.
*/

const INK = '#16181b'
const SLATE = '#5c636a'
const mono = { fontFamily: 'var(--font-mono)' }

function waves(
  w: number,
  h: number,
  rows: number,
  amp: number,
  freq: number,
  phase: number,
) {
  return Array.from({ length: rows }, (_, r) => {
    const y0 = (h / rows) * (r + 0.5)
    let d = ''
    for (let x = 0; x <= w; x += 6)
      d += `${x ? 'L' : 'M'}${x} ${(y0 + Math.sin((x / w) * Math.PI * 2 * freq + r * 0.55 + phase) * amp).toFixed(1)}`
    return d
  })
}
const passportWaves = [
  ...waves(500, 352, 22, 7, 2.5, 0),
  ...waves(500, 352, 22, 7, 2.5, Math.PI),
]
const cardWaves = [
  ...waves(428, 270, 18, 6, 2, 0),
  ...waves(428, 270, 18, 6, 2, Math.PI),
]

function Guilloche({
  paths,
  stroke = '#aeb5bc',
}: {
  paths: string[]
  stroke?: string
}) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.45">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  )
}

function Rosette({
  x,
  y,
  r,
  stroke = '#9aa2aa',
}: {
  x: number
  y: number
  r: number
  stroke?: string
}) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.5">
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx={r}
          ry={r * 0.38}
          transform={`rotate(${i * 11.25} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.38} />
    </g>
  )
}

function Specimen({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fontWeight="700"
      letterSpacing={size * 0.12}
      fill="none"
      stroke={INK}
      strokeOpacity="0.16"
      strokeWidth="1.4"
      transform={`rotate(-18 ${x} ${y})`}
    >
      SPECIMEN
    </text>
  )
}

function Field({
  x,
  y,
  label,
  value,
  size = 14.5,
}: {
  x: number
  y: number
  label: string
  value: string
  size?: number
}) {
  return (
    <g>
      <text x={x} y={y} fontSize="9.5" fill={SLATE} letterSpacing="0.3">
        {label}
      </text>
      <text
        x={x}
        y={y + size + 2}
        fontSize={size}
        fontWeight="600"
        fill={INK}
        letterSpacing="0.4"
      >
        {value}
      </text>
    </g>
  )
}

function Photo({
  x,
  y,
  w,
  h,
  look,
  opacity = 1,
}: {
  x: number
  y: number
  w: number
  h: number
  look: PortraitLook
  opacity?: number
}) {
  return (
    <svg
      x={x}
      y={y}
      width={w}
      height={h}
      viewBox="28 28 144 185"
      preserveAspectRatio="xMidYMid slice"
      opacity={opacity}
    >
      <rect width="200" height="240" fill="#e4e7e9" />
      <PortraitFigure look={look} pose={{ glasses: false }} animated={false} />
    </svg>
  )
}

function Signature({
  x,
  y,
  scale = 1,
}: {
  x: number
  y: number
  scale?: number
}) {
  return (
    <path
      d="M0 14 C6 -2 12 22 18 8 S28 -4 32 12 S40 20 46 6 S58 2 60 12 C64 20 70 8 76 10 S90 16 98 6"
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke="#2b3550"
      strokeWidth={1.6 / scale}
      strokeLinecap="round"
      opacity="0.85"
    />
  )
}

function Sheet({
  w,
  h,
  rx,
  tint,
  children,
  className,
}: {
  w: number
  h: number
  rx: number
  tint: [string, string]
  children: ReactNode
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('block h-auto w-full', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tint[0]} />
          <stop offset="1" stopColor={tint[1]} />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect width={w} height={h} rx={rx} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect width={w} height={h} fill={`url(#${uid}-bg)`} />
        {children}
      </g>
    </svg>
  )
}

/** The photo page of a specimen passport (TD3 size, 125 x 88 mm). */
export function PassportDataPage({
  facts,
  look,
  className,
}: {
  facts: DocumentFacts
  look: PortraitLook
  className?: string
}) {
  const [l1, l2] = passportMrz(facts)
  return (
    <Sheet
      w={500}
      h={352}
      rx={14}
      tint={['#f5f5f2', '#e6e8e9']}
      className={className}
    >
      <Guilloche paths={passportWaves} />
      <Rosette x={424} y={104} r={52} />
      <text
        x="24"
        y="36"
        fontSize="19"
        fontWeight="600"
        letterSpacing="4"
        fill={INK}
      >
        PASSPORT
      </text>
      <text
        x="476"
        y="35"
        textAnchor="end"
        fontSize="11"
        letterSpacing="1.5"
        fill={SLATE}
      >
        {facts.issuingCountry.toUpperCase()}
      </text>
      <Photo x={24} y={54} w={124} h={160} look={look} />
      <Field x={164} y={62} label="Type" value="P" />
      <Field x={206} y={62} label="Code" value={facts.issuingCode} />
      <Field x={278} y={62} label="Passport no." value={facts.number} />
      <Field x={164} y={100} label="Surname" value={facts.surname} />
      <Field x={164} y={136} label="Given names" value={facts.givenNames} />
      <Field x={164} y={172} label="Nationality" value={facts.nationality} />
      <Field
        x={164}
        y={208}
        label="Date of birth"
        value={printedDate(facts.dob)}
      />
      <Field x={330} y={208} label="Sex" value={facts.sex} />
      <Field
        x={164}
        y={244}
        label="Date of issue"
        value={printedDate(facts.issued)}
      />
      <Field
        x={330}
        y={244}
        label="Date of expiry"
        value={printedDate(facts.expiry)}
      />
      <Signature x={30} y={230} scale={1.1} />
      <Photo x={424} y={176} w={52} h={66} look={look} opacity={0.18} />
      <rect
        x="0"
        y="280"
        width="500"
        height="72"
        fill="#ffffff"
        opacity="0.5"
      />
      <text
        x="22"
        y="309"
        fontSize="17"
        textLength="456"
        lengthAdjust="spacingAndGlyphs"
        fill={INK}
        style={mono}
      >
        {l1}
      </text>
      <text
        x="22"
        y="336"
        fontSize="17"
        textLength="456"
        lengthAdjust="spacingAndGlyphs"
        fill={INK}
        style={mono}
      >
        {l2}
      </text>
      <Specimen x={290} y={170} size={58} />
    </Sheet>
  )
}

const cardTints: Record<string, [string, string]> = {
  driving_licence: ['#f6f2f1', '#e8e3e4'],
  national_identity_card: ['#f2f4f6', '#e2e7eb'],
  biometric_residence_permit: ['#f4f4f2', '#e5e6e3'],
}

/** Front of a specimen photocard (ID-1 size, 85.6 x 54 mm). */
export function CardFront({
  facts,
  look,
  className,
}: {
  facts: DocumentFacts
  look: PortraitLook
  className?: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const licence = facts.type === 'driving_licence'
  return (
    <Sheet
      w={428}
      h={270}
      rx={18}
      tint={cardTints[facts.type] ?? cardTints.national_identity_card}
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8d8ff" />
          <stop offset="0.35" stopColor="#f3c6ff" />
          <stop offset="0.7" stopColor="#c8ffe6" />
          <stop offset="1" stopColor="#fff1b8" />
        </linearGradient>
      </defs>
      <Guilloche paths={cardWaves} />
      <Rosette x={352} y={206} r={44} />
      <text
        x="22"
        y="34"
        fontSize="17"
        fontWeight="700"
        letterSpacing="2.5"
        fill={INK}
      >
        {facts.title.toUpperCase()}
      </text>
      <text
        x="406"
        y="33"
        textAnchor="end"
        fontSize="10.5"
        letterSpacing="1.4"
        fill={SLATE}
      >
        {facts.issuingCountry.toUpperCase()}
      </text>
      <Photo x={22} y={50} w={106} h={136} look={look} />
      {licence ? (
        <g fontSize="14" fontWeight="600" fill={INK}>
          {(
            [
              ['1.', facts.surname],
              ['2.', facts.givenNames],
              [
                '3.',
                `${dottedDate(facts.dob)}  ${facts.issuingCountry.toUpperCase()}`,
              ],
              [
                '4a.',
                `${dottedDate(facts.issued)}   4b. ${dottedDate(facts.expiry)}`,
              ],
              ['5.', facts.number],
            ] as const
          ).map(([n, v], i) => (
            <text key={n} x="146" y={72 + i * 25}>
              <tspan fontSize="10" fontWeight="400" fill={SLATE}>
                {n}{' '}
              </tspan>
              {v}
            </text>
          ))}
          {facts.address && (
            <text x="146" y="197" fontSize="11" fontWeight="500">
              <tspan fontSize="10" fontWeight="400" fill={SLATE}>
                8.{' '}
              </tspan>
              {facts.address.toUpperCase()}
            </text>
          )}
        </g>
      ) : (
        <>
          <Field
            x={146}
            y={58}
            label="Surname"
            value={facts.surname}
            size={14}
          />
          <Field
            x={146}
            y={92}
            label="Given names"
            value={facts.givenNames}
            size={14}
          />
          <Field
            x={146}
            y={126}
            label="Nationality"
            value={facts.nationality}
            size={13}
          />
          <Field x={318} y={126} label="Sex" value={facts.sex} size={13} />
          <Field
            x={146}
            y={160}
            label="Date of birth"
            value={dottedDate(facts.dob)}
            size={13}
          />
          <Field
            x={260}
            y={160}
            label="Date of expiry"
            value={dottedDate(facts.expiry)}
            size={13}
          />
          <Field
            x={146}
            y={194}
            label="Document no."
            value={facts.number}
            size={13}
          />
        </>
      )}
      <Signature x={24} y={204} scale={0.9} />
      <ellipse
        className="holo-sheen"
        cx="372"
        cy="232"
        rx="34"
        ry="22"
        fill={`url(#${uid}-holo)`}
        opacity="0.55"
      />
      <Specimen x={250} y={150} size={46} />
    </Sheet>
  )
}

/** Back of the same photocard: licence categories, or the three-line machine-readable zone. */
export function CardBack({
  facts,
  className,
}: {
  facts: DocumentFacts
  className?: string
}) {
  const licence = facts.type === 'driving_licence'
  const seed = [...facts.number].reduce(
    (s, c) => (s * 31 + c.charCodeAt(0)) >>> 0,
    11,
  )
  return (
    <Sheet
      w={428}
      h={270}
      rx={18}
      tint={cardTints[facts.type] ?? cardTints.national_identity_card}
      className={className}
    >
      <Guilloche paths={cardWaves} />
      {licence ? (
        <>
          <g fontSize="11" fill={INK}>
            {['AM', 'A', 'B1', 'B', 'BE', 'C1', 'D1'].map((cat, i) => {
              const held = ['AM', 'B1', 'B'].includes(cat)
              const from = `${Number(facts.dob.slice(0, 4)) + 18}${facts.dob.slice(4)}`
              return (
                <g key={cat}>
                  <line
                    x1="22"
                    x2="270"
                    y1={36 + i * 30}
                    y2={36 + i * 30}
                    stroke="#b9c0c6"
                    strokeWidth="0.8"
                  />
                  <text x="28" y={56 + i * 30} fontWeight="700" fontSize="13">
                    {cat}
                  </text>
                  <text x="82" y={56 + i * 30} style={mono}>
                    {held ? dottedDate(from) : '-'}
                  </text>
                  <text x="178" y={56 + i * 30} style={mono}>
                    {held ? dottedDate(facts.expiry) : '-'}
                  </text>
                </g>
              )
            })}
          </g>
          <g transform="translate(296 40)" fill={INK}>
            {Array.from({ length: 22 * 26 }, (_, i) =>
              (Math.imul(i + seed, 2654435761) >>> 13) & 1 ? (
                <rect
                  key={i}
                  x={(i % 22) * 5}
                  y={Math.floor(i / 22) * 5}
                  width="5"
                  height="5"
                />
              ) : null,
            )}
          </g>
          <text x="296" y="190" fontSize="9.5" fill={SLATE}>
            Encoded data
          </text>
        </>
      ) : (
        <>
          <Rosette x={330} y={84} r={50} />
          <Field
            x={22}
            y={38}
            label="Date of issue"
            value={dottedDate(facts.issued)}
            size={13}
          />
          <Field
            x={22}
            y={78}
            label="Place of issue"
            value={facts.issuingCountry.toUpperCase()}
            size={13}
          />
          <rect
            x="0"
            y="172"
            width="428"
            height="98"
            fill="#ffffff"
            opacity="0.55"
          />
          {cardMrz(facts).map((line, i) => (
            <text
              key={i}
              x="20"
              y={200 + i * 27}
              fontSize="18"
              textLength="388"
              lengthAdjust="spacingAndGlyphs"
              fill={INK}
              style={mono}
            >
              {line}
            </text>
          ))}
        </>
      )}
      <Specimen x={214} y={130} size={46} />
    </Sheet>
  )
}

/** The internationally recognised symbol for a document with a chip. */
export function ChipSymbol({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="0.75" y="0.75" width="28.5" height="18.5" rx="1.5" />
      <circle cx="15" cy="10" r="5" />
      <path d="M0.75 5 H29.25 M0.75 15 H29.25" />
    </svg>
  )
}

/** Closed specimen passport, cover up. */
export function PassportCover({
  country,
  className,
}: {
  country: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'grain relative flex aspect-88/125 flex-col items-center justify-between overflow-hidden rounded-[10px] bg-[linear-gradient(160deg,#30353b,#15171a)] px-2 py-3 text-center shadow-[0_18px_30px_-14px_rgb(0_0_0/0.55)]',
        className,
      )}
    >
      <span className="absolute inset-1.25 rounded-[7px] border border-white/10" />
      <span className="font-mono text-[7px] leading-tight tracking-[0.18em] text-white/55 uppercase">
        {country}
      </span>
      <svg
        viewBox="0 0 60 60"
        className="w-[42%] text-white/30"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse
            key={i}
            cx="30"
            cy="30"
            rx="27"
            ry="10"
            transform={`rotate(${i * 15} 30 30)`}
          />
        ))}
      </svg>
      <span className="text-metal text-[10px] font-medium tracking-[0.34em]">
        PASSPORT
      </span>
      <ChipSymbol className="w-[26%] text-white/50" />
    </div>
  )
}
