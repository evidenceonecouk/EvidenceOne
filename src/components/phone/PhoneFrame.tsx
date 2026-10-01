import { BatteryFull, Signal, Wifi } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/*
  Shows the individual's journey as it will look in the Evidence One app.
  On wide screens it renders inside a device frame; on a real phone the frame
  falls away and the screen fills the viewport.
*/
export function PhoneFrame({
  children,
  label = 'Evidence One app',
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        role="region"
        aria-label={label}
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-paper',
          // Phone sized screens: no device chrome, fills the space below the presenter bar
          'h-[calc(100dvh-3.5rem)]',
          // Larger screens: device chrome, scaled to fit the viewport height
          'sm:h-auto sm:w-[min(440px,calc((100dvh-6rem)*0.4621))] sm:aspect-[390/844] sm:rounded-[3rem] sm:border-[10px] sm:border-ink sm:shadow-[0_40px_80px_-30px_rgb(22_24_27/0.45),0_0_0_1px_rgb(22_24_27/0.08)]',
        )}
      >
        <StatusBar />
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        <div aria-hidden="true" className="hidden h-7 shrink-0 items-center justify-center sm:flex">
          <span className="h-[5px] w-32 rounded-full bg-ink/85" />
        </div>
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div aria-hidden="true" className="relative hidden h-11 shrink-0 items-center justify-between px-7 text-[0.9375rem] font-semibold text-ink sm:flex">
      <span className="tabular">9:41</span>
      <span className="absolute top-2.5 left-1/2 h-[1.6rem] w-[6.5rem] -translate-x-1/2 rounded-full bg-ink" />
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" strokeWidth={2.5} />
        <Wifi className="size-4" strokeWidth={2.5} />
        <BatteryFull className="size-5" strokeWidth={2} />
      </span>
    </div>
  )
}

/** Standard screen inside the phone frame: scrolling content with an optional fixed action footer. */
export function PhoneScreen({ children, footer, className }: { children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <>
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-3 pb-6', className)}>{children}</div>
      {footer && <div className="shrink-0 border-t border-line/70 bg-paper px-5 pt-4 pb-5">{footer}</div>}
    </>
  )
}
