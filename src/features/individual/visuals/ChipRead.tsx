import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { PassportCover } from '@/components/visual/IdDocumentMockup'
import { Portrait } from '@/components/visual/Portrait'
import type { PortraitLook } from '@/data/portraits'
import { printedDate, type DocumentFacts } from '@/lib/idDocument'
import { cn } from '@/lib/utils'
import { CHIP_AT } from './timings'

const span = (p: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (p - from) / (to - from)))

function hex(seed: string, n: number) {
  let h = 2166136261
  let out = ''
  for (let i = 0; out.length < n; i++) {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) + i), 16777619) >>> 0
    out += h.toString(16).toUpperCase().padStart(8, '0')
  }
  return out.slice(0, n)
}

/*
  The chip read. Before the scan, a phone settles onto the closed passport. Once
  connected, the chip's contents assemble on screen in the order they are read:
  the issuer's signature, then the photo, then the personal details.
*/
export function ChipRead({
  facts,
  look,
  progress,
  running,
  done,
}: {
  facts: DocumentFacts
  look: PortraitLook
  progress: number
  running: boolean
  done: boolean
}) {
  const p = done ? 100 : progress
  const connected = done || (running && p >= CHIP_AT.connected)

  return (
    <div
      aria-hidden="true"
      className="relative mt-6 h-[13.5rem] shrink-0 overflow-hidden rounded-3xl border border-line/70 bg-[radial-gradient(90%_80%_at_50%_30%,#ffffff,var(--mist))]"
    >
      {/* Phone on the passport */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-500 ease-out',
          connected ? 'scale-90 opacity-0' : 'opacity-100',
        )}
      >
        <div className="relative mt-3 w-[5.5rem]">
          <PassportCover country={facts.issuingCountry} />
          <span
            className={cn(
              'absolute top-[30%] left-1/2 size-28 -translate-1/2',
              running ? '' : 'opacity-60',
            )}
          >
            <span className="animate-nfc absolute inset-0 rounded-full border-2 border-ink/25" />
            <span className="animate-nfc absolute inset-0 rounded-full border-2 border-ink/25 [animation-delay:0.8s]" />
            <span className="animate-nfc absolute inset-0 rounded-full border-2 border-ink/25 [animation-delay:1.6s]" />
          </span>
          <div
            className={cn(
              'absolute -top-12 -left-3.5 h-[11rem] w-[7.25rem]',
              !running && 'animate-phone-place',
            )}
          >
            <div className="relative size-full rounded-[1.4rem] border-[1.5px] border-ink/35 bg-white/45 shadow-[0_20px_40px_-20px_rgb(22_24_27/0.5)]">
              <span className="absolute top-2.5 left-2.5 grid size-9 grid-cols-2 gap-1 rounded-xl border border-ink/25 bg-white/70 p-1.5">
                <i className="rounded-full border border-ink/40" />
                <i className="rounded-full border border-ink/40" />
                <i className="rounded-full border border-ink/40" />
              </span>
              {running && (
                <span className="animate-rise absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink px-2 py-1 text-[0.6875rem] font-medium whitespace-nowrap text-paper [animation-duration:300ms]">
                  <Lock className="size-3" />
                  Connecting
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* What the chip holds, assembling as it is read */}
      <div
        className={cn(
          'absolute inset-3 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]',
          connected ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        {connected && <ChipData facts={facts} look={look} p={p} />}
      </div>
    </div>
  )
}

function Tag({
  label,
  from,
  to,
  p,
}: {
  label: string
  from: number
  to: number
  p: number
}) {
  const state = p >= to ? 'done' : p >= from ? 'reading' : 'pending'
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[0.625rem] leading-none tracking-[0.06em] transition-colors duration-300',
        state === 'done'
          ? 'border-ink bg-ink text-paper'
          : state === 'reading'
            ? 'border-ink text-ink'
            : 'border-line text-slate',
      )}
    >
      {state === 'reading' && (
        <span className="size-1.5 animate-pulse rounded-full bg-ink" />
      )}
      {label}
    </span>
  )
}

function ChipData({
  facts,
  look,
  p,
}: {
  facts: DocumentFacts
  look: PortraitLook
  p: number
}) {
  const photo = span(p, CHIP_AT.signature, CHIP_AT.photo)
  const fields: { label: string; value: string; wide?: boolean }[] = [
    { label: 'Surname', value: facts.surname },
    { label: 'Date of birth', value: printedDate(facts.dob) },
    { label: 'Given names', value: facts.givenNames, wide: true },
    { label: 'Nationality', value: facts.nationality },
    { label: 'Expires', value: printedDate(facts.expiry) },
  ]
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-white px-3.5 pt-3 pb-2.5 shadow-[0_16px_36px_-24px_rgb(22_24_27/0.45)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-slate uppercase">
          From the chip
        </span>
        <span className="flex gap-1">
          <Tag
            label="SIG"
            from={CHIP_AT.connected}
            to={CHIP_AT.signature}
            p={p}
          />
          <Tag
            label="PHOTO"
            from={CHIP_AT.signature}
            to={CHIP_AT.photo}
            p={p}
          />
          <Tag label="DATA" from={CHIP_AT.photo} to={CHIP_AT.details} p={p} />
        </span>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 gap-3">
        <div className="relative h-[5.6rem] w-[4.35rem] shrink-0 overflow-hidden rounded-lg bg-mist">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgb(22_24_27/0.05)_3px_4px)]" />
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 ${100 - photo * 100}% 0)` }}
          >
            <Portrait look={look} className="size-full" />
          </div>
          {photo > 0 && photo < 1 && (
            <div
              className="absolute inset-x-0 h-0.5 bg-ink/70 shadow-[0_0_10px_2px_rgb(22_24_27/0.25)]"
              style={{ top: `${photo * 100}%` }}
            />
          )}
        </div>
        <dl className="grid min-w-0 flex-1 grid-cols-2 content-start gap-x-2.5 gap-y-1.5">
          {fields.map((f, i) => {
            const start = CHIP_AT.photo + i * 2.2
            const shown = Math.round(
              f.value.length * span(p, start, start + 5.5),
            )
            return (
              <div
                key={f.label}
                className={cn('min-w-0', f.wide && 'col-span-2')}
              >
                <dt className="text-[0.625rem] leading-tight text-slate">
                  {f.label}
                </dt>
                <dd className="mt-0.5 h-4 truncate text-[0.75rem] leading-4 font-medium tracking-[0.02em] text-ink">
                  {shown > 0 ? (
                    f.value.slice(0, shown)
                  ) : (
                    <span className="mt-1 block h-2 w-4/5 animate-pulse rounded-sm bg-line" />
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      <div className="mt-2 flex h-5 items-center gap-1.5 border-t border-line/70 pt-2 text-[0.6875rem] text-slate">
        {p < CHIP_AT.signature ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            <span>Checking signature</span>
            <span className="ml-auto font-mono tracking-[0.08em]">
              {hex(facts.number + Math.floor(p * 2), 12).replace(
                /(.{4})/g,
                '$1 ',
              )}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="size-3.5 text-ink" />
            <span className="text-ink">Signature valid</span>
            <span className="ml-auto truncate">
              Issued by {facts.issuingCountry}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
