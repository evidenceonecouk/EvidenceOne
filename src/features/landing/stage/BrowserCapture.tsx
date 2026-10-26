import { Lock, ScanFace } from 'lucide-react'
import { CompletionTick } from '@/components/brand/CompletionTick'

/* Decorative rendering of the browser capture step: a browser window, no Evidence One app. */
export function BrowserCapture({
  className = 'w-[440px]',
}: {
  className?: string
}) {
  return (
    <div
      className={`flex h-[560px] flex-col overflow-hidden rounded-[16px] bg-paper text-ink shadow-[0_50px_90px_-30px_rgb(0_0_0/0.75),0_0_0_1px_rgb(255_255_255/0.12)] ${className}`}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-[#f4f5f5] px-3">
        <span className="size-2.5 rounded-full bg-[#dcdfe1]" />
        <span className="size-2.5 rounded-full bg-[#dcdfe1]" />
        <span className="size-2.5 rounded-full bg-[#dcdfe1]" />
        <div className="mx-auto flex h-6 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-paper text-[11px] text-slate ring-1 ring-line">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">
            evidenceone.co.uk/journey/EO-2026-000135
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-5">
        <div className="flex items-center justify-between gap-2 text-[12px] text-slate">
          <span>Check your document</span>
          <span className="rounded-full border border-line px-2 py-0.5 font-medium text-graphite">
            Certified identity provider
          </span>
        </div>
        <p className="mt-3 text-[20px] leading-[1.2] tracking-[-0.02em]">
          Centre your face in the oval
        </p>

        <div className="relative mx-auto mt-4 flex h-[190px] w-full items-center justify-center rounded-xl bg-[#1b1d20]">
          <span className="flex h-[150px] w-[112px] items-center justify-center rounded-[50%] border-2 border-dashed border-paper/70">
            <ScanFace className="size-12 text-paper/50" strokeWidth={1} />
          </span>
          <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.1em] text-paper/70 uppercase">
            Liveness
          </span>
        </div>

        <ul className="mt-5 space-y-2.5 text-[14px]">
          <li className="flex items-center gap-2.5">
            <CompletionTick className="size-[18px]" />
            Document captured
          </li>
          <li className="flex items-center gap-2.5">
            <CompletionTick className="size-[18px]" />
            Document authenticity checked
          </li>
          <li className="flex items-center gap-2.5 text-slate">
            <span className="size-[18px] animate-spin rounded-full border-2 border-line border-t-ink [animation-duration:900ms]" />
            Liveness and face match
          </li>
        </ul>

        <p className="mt-auto text-[11px] leading-snug text-slate">
          Your identity verification is being conducted by Harcourt Lane
          Solicitors LLP using the Evidence One platform.
        </p>
      </div>
    </div>
  )
}
