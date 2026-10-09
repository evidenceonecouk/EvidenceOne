import { useMemo } from 'react'

const N = 25

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

const inFinder = (x: number, y: number) =>
  (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)

/**
  A clearly synthetic QR-style graphic for the demo. It has the three corner
  squares people expect, a pseudo-random pattern derived from the case, and a
  DEMO mark in the middle. It cannot be scanned.
*/
export function SyntheticQr({
  seed,
  className,
}: {
  seed: string
  className?: string
}) {
  const cells = useMemo(() => {
    let h = hash(seed)
    const out: [number, number][] = []
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        h = (Math.imul(h, 1103515245) + 12345) >>> 0
        if (!inFinder(x, y) && (h >>> 16) % 100 < 46) out.push([x, y])
      }
    return out
  }, [seed])
  const finders: [number, number][] = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ]
  return (
    <svg
      viewBox={`-2 -2 ${N + 4} ${N + 4}`}
      className={className}
      role="img"
      aria-label="Demo QR code. It is not a real code and cannot be scanned."
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#ffffff" />
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="1"
          height="1"
          fill="#16181b"
        />
      ))}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#16181b" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#ffffff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#16181b" />
        </g>
      ))}
      <rect x="8.5" y="10.5" width="8" height="4" rx="0.8" fill="#ffffff" />
      <text
        x="12.5"
        y="13.4"
        textAnchor="middle"
        fontSize="2.6"
        fontWeight="700"
        fill="#16181b"
        fontFamily="ui-monospace, monospace"
      >
        DEMO
      </text>
    </svg>
  )
}
