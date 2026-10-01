import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/*
 * Small hand-drawn SVG charts for the operations dashboard.
 * Single hue (ink) for magnitude; decision colours only where the data is a decision; every series also has a label.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.floor(el.clientWidth))
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

function niceMax(v: number) {
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / step
  const nice = n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return nice * step
}

/** Smooth path with horizontal tangents at each point, so the curve never overshoots the data. */
function smoothPath(pts: [number, number][]) {
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`
    const [px, py] = pts[i - 1]
    const mx = (px + x) / 2
    return `${d} C${mx},${py} ${mx},${y} ${x},${y}`
  }, '')
}

export interface TrendSeries {
  label: string
  values: number[]
  /** CSS colour for the line. */
  color: string
  area?: boolean
  dashed?: boolean
}

/** Line and area chart with a crosshair tooltip. Arrow keys move the crosshair when focused. */
export function TrendChart({
  labels,
  series,
  height = 260,
  ariaLabel,
  dark,
}: {
  labels: string[]
  series: TrendSeries[]
  height?: number
  ariaLabel: string
  dark?: boolean
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const pad = { top: 16, right: 12, bottom: 30, left: 36 }
  const w = Math.max(0, width - pad.left - pad.right)
  const h = height - pad.top - pad.bottom
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)))
  const n = labels.length
  const x = (i: number) => pad.left + (n === 1 ? w / 2 : (i / (n - 1)) * w)
  const y = (v: number) => pad.top + h - (v / max) * h
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const axis = dark ? 'rgb(250 250 249 / 0.62)' : 'var(--slate)'
  const grid = dark ? 'rgb(250 250 249 / 0.1)' : 'var(--line-soft)'

  const onMove = (clientX: number) => {
    const el = ref.current
    if (!el || w <= 0) return
    const rx = clientX - el.getBoundingClientRect().left - pad.left
    setActive(Math.max(0, Math.min(n - 1, Math.round((rx / w) * (n - 1)))))
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((a) =>
        Math.max(
          0,
          Math.min(n - 1, (a ?? n - 1) + (e.key === 'ArrowRight' ? 1 : -1)),
        ),
      )
    }
    if (e.key === 'Escape') setActive(null)
  }
  const shown = active ?? null
  const tipLeft =
    shown !== null
      ? Math.min(Math.max(x(shown), 90), Math.max(90, width - 90))
      : 0

  return (
    <div
      ref={ref}
      className="relative w-full rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-highlight"
      style={{ height }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setActive(null)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="absolute inset-0 block overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient
                key={i}
                id={`trend-fill-${i}-${dark ? 'd' : 'l'}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={s.color}
                  stopOpacity={dark ? 0.32 : 0.18}
                />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={pad.left + w}
                y1={y(t)}
                y2={y(t)}
                stroke={grid}
                strokeDasharray={t === 0 ? undefined : '2 4'}
              />
              <text
                x={pad.left - 10}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize="12"
                fill={axis}
                className="tabular"
              >
                {Math.round(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % (n > 8 && width < 640 ? 3 : n > 8 ? 2 : 1) === 0 ||
            i === n - 1 ? (
              <text
                key={l}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="12"
                fill={axis}
                fontWeight={i === n - 1 ? 600 : 400}
              >
                {l}
              </text>
            ) : null,
          )}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number])
            const line = smoothPath(pts)
            return (
              <g key={s.label}>
                {s.area && (
                  <path
                    d={`${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                    fill={`url(#trend-fill-${si}-${dark ? 'd' : 'l'})`}
                    className="animate-fade-in"
                  />
                )}
                <path
                  d={line}
                  pathLength={s.dashed ? undefined : 1}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.area ? 2.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={s.dashed ? 'animate-fade-in' : 'animate-draw'}
                  strokeDasharray={s.dashed ? '6 6' : undefined}
                />
                <circle
                  cx={x(n - 1)}
                  cy={y(s.values[n - 1])}
                  r={4.5}
                  fill={s.color}
                  stroke={dark ? 'var(--ink)' : 'white'}
                  strokeWidth={2}
                  className="animate-fade-in"
                />
              </g>
            )
          })}
          {shown !== null && (
            <g>
              <line
                x1={x(shown)}
                x2={x(shown)}
                y1={pad.top}
                y2={pad.top + h}
                stroke={dark ? 'rgb(250 250 249 / 0.45)' : 'var(--silver)'}
              />
              {series.map((s) => (
                <circle
                  key={s.label}
                  cx={x(shown)}
                  cy={y(s.values[shown])}
                  r={5}
                  fill={s.color}
                  stroke={dark ? 'var(--ink)' : 'white'}
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>
      )}
      {shown !== null && (
        <div
          className={cn(
            'pointer-events-none absolute top-0 z-10 min-w-[10rem] -translate-x-1/2 rounded-xl border px-3.5 py-2.5 text-[0.875rem] shadow-lg',
            dark
              ? 'border-white/15 bg-graphite text-paper'
              : 'border-line bg-white text-ink',
          )}
          style={{ left: tipLeft }}
        >
          <p
            className={cn(
              'mb-1.5 font-medium',
              dark ? 'text-paper' : 'text-ink',
            )}
          >
            {labels[shown]}
          </p>
          {series.map((s) => (
            <p
              key={s.label}
              className="flex items-center justify-between gap-4 tabular"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
              <span className="font-medium">{s.values[shown]}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Tiny trend line for a stat tile. */
export function Sparkline({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map(
    (v, i) =>
      [(i / (values.length - 1)) * 100, 28 - ((v - min) / range) * 24] as [
        number,
        number,
      ],
  )
  const line = smoothPath(pts)
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn('h-9 w-full overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.1} />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L100,32 L0,32 Z`} fill="url(#spark-fill)" />
      <path
        d={line}
        pathLength={1}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={1.75}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        className="animate-draw"
      />
    </svg>
  )
}

/** Ring split into labelled segments with a 2px gap between them. */
export function Donut({
  segments,
  size = 188,
  children,
  ariaLabel,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
  children?: ReactNode
  ariaLabel: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const stroke = 22
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  const gap = 3
  const offsets = segments.map((_, i) =>
    segments.slice(0, i).reduce((s, x) => s + (x.value / total) * c, 0),
  )
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mist)"
          strokeWidth={stroke}
        />
        {segments.map((s, i) => {
          const len = Math.max(0, (s.value / total) * c - gap)
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? stroke + 6 : stroke}
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={-offsets[i]}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="animate-ring"
              style={
                {
                  '--ring': `${c}px`,
                  animationDelay: `${i * 120}ms`,
                  transition: 'stroke-width 150ms ease-out',
                } as React.CSSProperties
              }
            />
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {hover !== null ? (
          <>
            <span className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
              {Math.round((segments[hover].value / total) * 100)}%
            </span>
            <span className="mt-1.5 max-w-[7.5rem] text-[0.875rem] leading-tight text-slate">
              {segments[hover].label}
            </span>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

/** Vertical bars with a hover value. `highlight` marks bars that carry a status, which also get a label. */
export function Bars({
  data,
  height = 180,
  ariaLabel,
  marker,
}: {
  data: {
    label: string
    value: number
    tone?: 'ink' | 'muted' | 'warn'
    tip?: string
  }[]
  height?: number
  ariaLabel: string
  /** Draw a dashed reference line before the bar at this index. */
  marker?: { before: number; label: string }
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value)))
  return (
    <div role="img" aria-label={ariaLabel}>
      <div
        className="relative flex items-end gap-1.5 border-b border-line sm:gap-2"
        style={{ height }}
      >
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 items-end"
          >
            {marker?.before === i && (
              <div
                className="pointer-events-none absolute inset-y-0 -left-[5px] z-10 border-l-2 border-dashed border-info sm:-left-[6px]"
                aria-hidden="true"
              >
                <span className="absolute -top-7 right-1.5 rounded bg-info-wash px-1.5 py-0.5 font-mono text-[0.75rem] whitespace-nowrap text-info">
                  {marker.label}
                </span>
              </div>
            )}
            <div
              className={cn(
                'animate-grow-y relative w-full origin-bottom rounded-t-[4px] transition-colors duration-150',
                d.tone === 'warn'
                  ? 'bg-info'
                  : d.tone === 'muted'
                    ? 'bg-silver group-hover:bg-slate'
                    : 'bg-ink group-hover:bg-graphite-soft',
              )}
              style={{
                height: `${(d.value / max) * 100}%`,
                animationDelay: `${i * 40}ms`,
              }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[0.8125rem] whitespace-nowrap text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular">
                {d.tip ?? d.value}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="min-w-0 flex-1 text-center font-mono text-[0.75rem] tracking-tight whitespace-nowrap text-slate"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A horizontal meter that grows from zero. */
export function Meter({
  value,
  max = 100,
  tone = 'ink',
  delay = 0,
  className,
}: {
  value: number
  max?: number
  tone?: 'ink' | 'muted' | 'highlight'
  delay?: number
  className?: string
}) {
  return (
    <div
      className={cn('h-2.5 overflow-hidden rounded-full bg-mist', className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          'animate-grow-x h-full origin-left rounded-full',
          tone === 'muted'
            ? 'bg-silver'
            : tone === 'highlight'
              ? 'bg-highlight'
              : 'bg-ink',
        )}
        style={{
          width: `${(value / max) * 100}%`,
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  )
}
