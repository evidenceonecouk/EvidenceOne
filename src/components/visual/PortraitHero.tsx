import { Check } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { heroScan } from '@/data/copy'
import { cn } from '@/lib/utils'

/*
  The hero portrait. A fictional, AI-generated person (no real individual).
  Her head and eyes follow the cursor left and right, and when one of the
  primary actions (on the left) is hovered or focused she turns towards it and
  smiles. Head and smile are one track of frames (right turn, centre, left turn,
  smile), scrubbed by a speed-limited spring with adjacent frames blended, so
  every change plays through every frame, however fast the pointer moves. The
  smile clip starts with optical-flow morph frames from the last frame of the
  left turn, so the strip is continuous. When the head is centred an idle loop
  gives her life. Everything is drawn on one canvas from frame sequences baked
  by `scripts/hero-frames.py`, so the clips match exactly. A scan overlay is
  drawn on top.

  Smile: dispatch `window.dispatchEvent(new CustomEvent('eye:focus', { detail: true }))`.
  Assets live in `public/hero/`. Reduced motion shows the still only.
*/

const W = 1264
const H = 848
const ASPECT = W / H

/**
  A clip baked into a frame sequence by `scripts/hero-frames.py`. Every frame
  is already aligned and colour-matched to the master still at canvas size, so
  frames from different clips cross-fade without a visible change. `progress`
  maps each frame to 0..1 of the movement, evened out by measured motion.
*/
type Seq = {
  frames: (HTMLImageElement | undefined)[]
  progress: number[]
  fps: number
}
type SeqMeta = { frames: number; progress: number[]; fps: number }
const SEQ_NAMES = ['turn_l', 'turn_r', 'smile_l'] as const
type SeqName = (typeof SEQ_NAMES)[number]

// Face landmarks in frame units (1264 x 848), for the neutral front pose
const FACE = { cx: 640, cy: 410, rx: 185, ry: 235 }
const BOX = { x1: 452, y1: 172, x2: 826, y2: 636, arm: 34 }
const MESH: { pts: [number, number][]; closed?: boolean }[] = [
  {
    pts: [
      [488, 430],
      [500, 510],
      [540, 575],
      [595, 612],
      [638, 622],
      [685, 612],
      [735, 575],
      [775, 510],
      [790, 430],
    ],
  },
  {
    pts: [
      [520, 346],
      [560, 335],
      [600, 342],
    ],
  },
  {
    pts: [
      [680, 342],
      [720, 335],
      [760, 346],
    ],
  },
  {
    pts: [
      [633, 400],
      [633, 440],
      [610, 480],
      [633, 490],
      [656, 480],
    ],
  },
  {
    pts: [
      [590, 522],
      [614, 513],
      [638, 515],
      [662, 513],
      [686, 522],
      [662, 532],
      [614, 532],
    ],
    closed: true,
  },
  {
    pts: [
      [563, 380],
      [703, 380],
    ],
  },
  {
    pts: [
      [560, 250],
      [638, 235],
      [715, 250],
    ],
  },
]

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

/** The master still: the poster shown while the clips load. */
const POSTER = '/hero/pose_c.webp'
/** First frame of the idle loop, which every clip is baked to meet: the canvas starts from it. */
const PLATE = '/hero/seq/plate.webp'
/** The idle loop as a ping-pong video, drawn into the canvas (hardware-decoded, almost no memory). */
const IDLE = '/hero/seq/idle.mp4'

/**
  The simulated checks, in a row on her chest: the last completed check and the
  one in progress, step by step. Yellow tick only on completion.
*/
function ScanChips({ animate }: { animate: boolean }) {
  const checks = heroScan.checks
  const [step, setStep] = useState(animate ? 0 : checks.length)

  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(
      () => setStep((s) => (s >= checks.length + 2 ? 0 : s + 1)),
      1600,
    )
    return () => window.clearInterval(id)
  }, [animate, checks.length])

  // While checking: [previous, done] [current, in progress]. At the end: the last two, both done.
  const current = Math.min(step, checks.length)
  const first = Math.max(0, Math.min(current - 1, checks.length - 2))
  const items = checks
    .slice(first, Math.min(current, checks.length - 1) + 1)
    .map((label, i) => ({ label, done: first + i < step }))

  return (
    <ul
      aria-hidden="true"
      className="absolute top-[79%] left-1/2 flex -translate-x-1/2 gap-2 whitespace-nowrap"
    >
      {items.map(({ label, done }) => (
        <li
          key={label}
          className="animate-rise flex items-center gap-2.5 rounded-full bg-ink/85 py-1.5 pr-4 pl-2 font-mono text-[0.75rem] tracking-[0.08em] text-paper ring-1 ring-white/10 backdrop-blur"
        >
          <span
            className={cn(
              'grid size-5 place-items-center rounded-full transition-colors duration-300',
              done ? 'bg-highlight text-ink' : 'bg-white/15',
            )}
          >
            {done ? (
              <Check className="size-3" strokeWidth={3} />
            ) : (
              <span className="size-1.5 animate-pulse rounded-full bg-silver" />
            )}
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}

export function PortraitHero({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const idleRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<SVGGElement>(null)
  const meshRef = useRef<SVGGElement>(null)
  const scanRef = useRef<SVGGElement>(null)
  const [ready, setReady] = useState(false)
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (reduced) return
    const frame = frameRef.current
    const canvas = canvasRef.current
    const idle = idleRef.current
    const overlay = overlayRef.current
    const mesh = meshRef.current
    const scan = scanRef.current
    const ctx = canvas?.getContext('2d')
    if (!frame || !canvas || !ctx || !overlay || !idle) return

    let plateReady = false
    const plate = new Image()
    plate.src = PLATE
    plate
      .decode()
      .then(() => {
        plateReady = true
        setReady(true)
      })
      .catch(() => {})

    const seqs: Partial<Record<SeqName, Seq>> = {}
    for (const name of SEQ_NAMES) {
      fetch(`/hero/seq/${name}/meta.json`)
        .then((res) => res.json() as Promise<SeqMeta>)
        .then((meta) => {
          const seq: Seq = {
            frames: new Array(meta.frames),
            progress: meta.progress,
            fps: meta.fps,
          }
          // Coarse frames first, so the clip works early and sharpens as the rest arrive
          const order = Array.from({ length: meta.frames }, (_, i) => i).sort(
            (a, b) => (a % 8) - (b % 8),
          )
          for (const i of order) {
            // Decode off the main thread before first use, so drawing a frame never stalls
            const im = new Image()
            im.src = `/hero/seq/${name}/${String(i).padStart(3, '0')}.webp`
            im.decode()
              .then(() => {
                seq.frames[i] = im
              })
              .catch(() => {})
          }
          seqs[name] = seq
        })
        .catch(() => {})
    }

    // One track for the whole performance, so every change plays frame by frame:
    // 0..1 right turn, 0..-1 left turn, -1..-2 smile (which continues the left turn).
    const st = {
      p: 0,
      v: 0,
      gx: 0,
      focus: false,
      visible: true,
      lastMove: 0,
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = frame.getBoundingClientRect()
      const fx = r.left + r.width * 0.506
      st.gx = clamp(((e.clientX - fx) / (window.innerWidth * 0.5)) * 1.8, -1, 1)
      st.lastMove = performance.now()
    }
    const onLeave = () => {
      st.gx = 0
    }
    const onFocus = (e: Event) => {
      st.focus = (e as CustomEvent<boolean>).detail === true
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('eye:focus', onFocus)

    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting
      if (st.visible) idle.play().catch(() => {})
      else idle.pause()
    })
    io.observe(frame)

    const drawImg = (img: HTMLImageElement, alpha: number) => {
      ctx.globalAlpha = alpha
      ctx.drawImage(img, 0, 0, W, H)
    }

    const nearestFrame = (seq: Seq, i: number) => {
      for (let d = 0; d < seq.frames.length; d++) {
        const f = seq.frames[i - d] ?? seq.frames[i + d]
        if (f) return f
      }
      return undefined
    }

    /** Draws a clip at progress p (0..1), blending the two frames either side. */
    const drawAt = (seq: Seq, p: number, alpha: number) => {
      const prog = seq.progress
      let i = 0
      while (i < prog.length - 2 && prog[i + 1] < p) i++
      const span = prog[i + 1] - prog[i]
      const f = span > 0 ? clamp((p - prog[i]) / span, 0, 1) : 0
      const a = nearestFrame(seq, i)
      const b = nearestFrame(seq, i + 1)
      if (!a) return false
      drawImg(a, alpha)
      if (b && b !== a && f > 0.002) drawImg(b, alpha * f)
      return true
    }

    let raf = 0
    let prev = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (!st.visible || document.hidden) return

      // Target on the track: an action hovered or focused (they sit on the left) means turn left
      // and smile; otherwise follow the pointer, and look back at the viewer once it has been still.
      let target = st.gx
      if (st.focus) target = -2
      else if (now - st.lastMove > 3000) target = 0
      // Speed-limited spring: however fast the pointer moves, the head turns in no less than about
      // half a second and the smile in about a second, through every frame, never skipping.
      const vmax = st.p < -1 || target < -1 ? 1.1 : 2.2
      const want = clamp((target - st.p) * 4, -vmax, vmax)
      st.v += (want - st.v) * (1 - Math.exp(-dt * 12))
      st.p = clamp(st.p + st.v * dt, -2, 1)

      // Head and smile from the track
      ctx.globalAlpha = 1
      const p = st.p
      let drawn = false
      if (p > 0.001 && seqs.turn_r) drawn = drawAt(seqs.turn_r, p, 1)
      else if (p < -1 && seqs.smile_l)
        drawn = drawAt(seqs.smile_l, clamp(-p - 1, 0, 1), 1)
      if (!drawn && p < -0.001 && seqs.turn_l)
        drawn = drawAt(seqs.turn_l, clamp(-p, 0, 1), 1)
      if (!drawn && plateReady) drawImg(plate, 1)

      // Resting state on top, faded out as the head starts to turn: the idle loop (ping-pong, so no seam)
      const wc = drawn ? 1 - clamp(Math.abs(p) * 8, 0, 1) : 1
      if (wc > 0.002 && idle.readyState >= 2) {
        ctx.globalAlpha = wc
        ctx.drawImage(idle, 0, 0, W, H)
      }
      ctx.globalAlpha = 1

      // Scan overlay follows the head a little and sweeps down the face
      overlay.setAttribute(
        'transform',
        `translate(${(clamp(p, -1, 1) * 16).toFixed(1)} 0)`,
      )
      if (mesh) mesh.style.opacity = String(0.9 * wc * wc)
      if (scan) {
        const p = (now / 3400) % 1
        const tri = p < 0.5 ? p * 2 : 2 - p * 2
        const eased = tri * tri * (3 - 2 * tri)
        scan.setAttribute(
          'transform',
          `translate(0 ${(190 + eased * 430).toFixed(1)})`,
        )
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('eye:focus', onFocus)
    }
  }, [reduced])

  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        role="img"
        aria-label={heroScan.alt}
        className="absolute inset-0 [container-type:size] [mask-image:linear-gradient(to_top,transparent_0,#000_12%)] lg:[mask-image:linear-gradient(to_right,transparent_0,#000_26%)]"
      >
        {/* Frame: the 1264 x 848 picture, covering the panel, face kept in view */}
        <div
          ref={frameRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: `max(100cqw, ${(ASPECT * 100).toFixed(2)}cqh)`,
            aspectRatio: `${W} / ${H}`,
          }}
        >
          <img
            src={POSTER}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full"
          />
          {!reduced && (
            <video
              ref={idleRef}
              src={IDLE}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 size-full opacity-0"
            />
          )}
          {!reduced && (
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className={cn(
                'absolute inset-0 size-full transition-opacity duration-500',
                ready ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <defs>
              <clipPath id={`${uid}-face`}>
                <ellipse cx={FACE.cx} cy={FACE.cy} rx={FACE.rx} ry={FACE.ry} />
              </clipPath>
              <linearGradient id={`${uid}-glow`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#fafaf9" stopOpacity="0" />
                <stop offset="1" stopColor="#fafaf9" stopOpacity="0.14" />
              </linearGradient>
              <linearGradient id={`${uid}-line`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#fafaf9" stopOpacity="0" />
                <stop offset="0.22" stopColor="#fafaf9" stopOpacity="0.9" />
                <stop offset="0.78" stopColor="#fafaf9" stopOpacity="0.9" />
                <stop offset="1" stopColor="#fafaf9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g>
              <g ref={overlayRef}>
                {/* Corner brackets */}
                {[
                  [BOX.x1, BOX.y1, 1, 1],
                  [BOX.x2, BOX.y1, -1, 1],
                  [BOX.x1, BOX.y2, 1, -1],
                  [BOX.x2, BOX.y2, -1, -1],
                ].map(([x, y, sx, sy]) => (
                  <path
                    key={`${x}${y}`}
                    d={`M ${x + sx * BOX.arm} ${y} H ${x} V ${y + sy * BOX.arm}`}
                    fill="none"
                    stroke="#fafaf9"
                    strokeOpacity="0.85"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Landmark mesh, fades as the head turns away from the front pose */}
                <g ref={meshRef} style={{ opacity: 0.9 }}>
                  {MESH.map((m, i) => (
                    <g key={i}>
                      <polyline
                        points={m.pts.map((p) => p.join(',')).join(' ')}
                        fill="none"
                        stroke="#fafaf9"
                        strokeOpacity="0.4"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                      {m.closed && (
                        <line
                          x1={m.pts[m.pts.length - 1][0]}
                          y1={m.pts[m.pts.length - 1][1]}
                          x2={m.pts[0][0]}
                          y2={m.pts[0][1]}
                          stroke="#fafaf9"
                          strokeOpacity="0.4"
                          strokeWidth="1.2"
                        />
                      )}
                      {m.pts.map(([x, y]) => (
                        <circle
                          key={`${x}${y}`}
                          cx={x}
                          cy={y}
                          r="2.6"
                          fill="#fafaf9"
                          fillOpacity="0.85"
                        />
                      ))}
                    </g>
                  ))}
                </g>

                {/* Scan line, clipped to the face */}
                <g clipPath={`url(#${uid}-face)`}>
                  <g ref={scanRef}>
                    <rect
                      x={FACE.cx - FACE.rx}
                      y="-70"
                      width={FACE.rx * 2}
                      height="70"
                      fill={`url(#${uid}-glow)`}
                    />
                    <rect
                      x={FACE.cx - FACE.rx}
                      y="-1.5"
                      width={FACE.rx * 2}
                      height="3"
                      fill={`url(#${uid}-line)`}
                    />
                  </g>
                </g>
              </g>
            </g>
          </svg>

          <ScanChips animate={!reduced} />
        </div>
      </div>
    </div>
  )
}
