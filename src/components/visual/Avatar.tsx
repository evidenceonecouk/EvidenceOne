import { useState } from 'react'
import { cn } from '@/lib/utils'

const tints = ['#eceeef', '#e4e6e8', '#f1f1ef', '#e8e9e6']

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/*
  Illustrated avatar for fictional people (never a photograph of a real person).
  Falls back to tinted initials if the illustration cannot load.
*/
export function Avatar({
  seed,
  name,
  size = 40,
  className,
}: {
  seed: string
  name: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const tint = tints[hash(seed) % tints.length]
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium text-ink ring-2 ring-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: tint,
        fontSize: size * 0.38,
      }}
    >
      {failed ? (
        initials
      ) : (
        <img
          src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full scale-110"
        />
      )}
    </span>
  )
}

const marks = [['#1d1f23', '#fafaf9']] as const

/** Monogram tile standing in for a client company's logo. */
export function CompanyMark({
  name,
  size = 44,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const [bg, fg] = marks[hash(name) % marks.length]
  const letters = name
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w && !['LTD', 'LIMITED', 'LLP', 'PLC', 'THE'].includes(w.toUpperCase()),
    )
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[10px] font-medium tracking-[-0.01em]',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: size * 0.36,
      }}
    >
      {letters}
    </span>
  )
}
