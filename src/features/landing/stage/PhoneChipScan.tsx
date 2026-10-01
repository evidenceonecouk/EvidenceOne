import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { CompletionTick } from '@/components/brand/CompletionTick'

/* Decorative rendering of the app's passport chip scan step. */
export function PhoneChipScan() {
  return (
    <div className="flex h-[600px] w-[290px] flex-col overflow-hidden rounded-[44px] border-[9px] border-[#0c0d0f] bg-paper text-ink shadow-[0_50px_90px_-30px_rgb(0_0_0/0.75),0_0_0_1px_rgb(255_255_255/0.12)]">
      <div className="relative flex h-10 shrink-0 items-center justify-between px-6 text-[12px] font-semibold">
        <span>9:41</span>
        <span className="absolute top-2 left-1/2 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-[#0c0d0f]" />
        <span className="flex items-center gap-1">
          <Signal className="size-3" strokeWidth={2.5} />
          <Wifi className="size-3" strokeWidth={2.5} />
          <BatteryFull className="size-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-2 pb-5">
        <div className="flex items-center justify-between text-[11px] text-slate">
          <span>Step 2 of 4</span>
          <span className="flex gap-1">
            <i className="h-1 w-5 rounded-full bg-ink" />
            <i className="h-1 w-5 rounded-full bg-ink" />
            <i className="h-1 w-5 rounded-full bg-line" />
            <i className="h-1 w-5 rounded-full bg-line" />
          </span>
        </div>
        <p className="mt-4 text-[20px] leading-[1.2] font-normal tracking-[-0.02em]">
          Hold your passport to the back of your phone
        </p>

        {/* Chip reader visual */}
        <div className="relative mx-auto mt-6 flex size-[150px] items-center justify-center">
          <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25" />
          <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25 [animation-delay:0.8s]" />
          <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25 [animation-delay:1.6s]" />
          <span className="relative flex h-[92px] w-[68px] flex-col justify-between rounded-[10px] bg-ink p-2.5 shadow-lg">
            <span className="h-[3px] w-6 rounded-full bg-paper/30" />
            <span className="mx-auto grid size-7 grid-cols-2 gap-[2px] rounded-[4px] border border-highlight/70 p-[3px]">
              <i className="rounded-[1px] bg-highlight/80" />
              <i className="rounded-[1px] bg-highlight/80" />
              <i className="rounded-[1px] bg-highlight/80" />
              <i className="rounded-[1px] bg-highlight/80" />
            </span>
            <span className="text-center font-mono text-[7px] tracking-[0.2em] text-paper/60">
              PASSPORT
            </span>
          </span>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-[12px]">
            <span className="font-medium">Reading chip</span>
            <span className="text-slate tabular">72%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full w-[72%] rounded-full bg-ink" />
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-[13px]">
          <li className="flex items-center gap-2.5">
            <CompletionTick className="size-[18px]" />
            Chip signature validated
          </li>
          <li className="flex items-center gap-2.5">
            <CompletionTick className="size-[18px]" />
            Photo read from the chip
          </li>
          <li className="flex items-center gap-2.5 text-slate">
            <span className="size-[18px] animate-spin rounded-full border-2 border-line border-t-ink [animation-duration:900ms]" />
            Personal details
          </li>
        </ul>

        <p className="mt-auto text-[10.5px] leading-snug text-slate">
          Conducted by Harcourt Lane Solicitors LLP using the Evidence One
          platform.
        </p>
      </div>
    </div>
  )
}
