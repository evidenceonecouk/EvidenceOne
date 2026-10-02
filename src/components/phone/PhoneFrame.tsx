import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Real iPhone screen height in CSS px (390 x 844 screen), plus the 10px bezel on each side. */
const SCREEN_H = 844
const BEZEL = 10
const DEVICE_H = SCREEN_H + BEZEL * 2
/* Presenter bar (3.5rem) plus breathing room above and below the device. */
const RESERVED_H = 56 + 56
/* Below this the type gets too small to read; the page scrolls instead. */
const MIN_SCALE = 0.66

/** Scale that fits the full-size device into the viewport height on sm and up; 1 on phones. */
function useDeviceScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 640px)')
    const update = () =>
      setScale(
        wide.matches
          ? Math.max(
              MIN_SCALE,
              Math.min(1, (window.innerHeight - RESERVED_H) / DEVICE_H),
            )
          : 1,
      )
    update()
    window.addEventListener('resize', update)
    wide.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      wide.removeEventListener('change', update)
    }
  }, [])
  return scale
}

/*
  Shows the individual's journey as it will look in the Evidence One app.
  On wide screens it renders inside a device frame at a real phone's size and
  aspect ratio (390 x 844), so content lays out exactly as on a phone, then the
  whole device is zoomed down evenly to fit the viewport height and centred.
  On a real phone the frame falls away and the screen fills the viewport.
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
  const scale = useDeviceScale()
  return (
    <div
      className={cn(
        'flex flex-col items-center sm:min-h-[calc(100dvh-3.5rem)] sm:justify-center sm:py-7',
        className,
      )}
    >
      <div
        role="region"
        aria-label={label}
        style={{ zoom: scale }}
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-paper',
          // Phone sized screens: no device chrome, fills the space below the presenter bar
          'h-[calc(100dvh-3.5rem)]',
          // Larger screens: device chrome around a real 390 x 844 screen
          'sm:h-[864px] sm:w-[410px] sm:shrink-0 sm:rounded-[3rem] sm:border-[10px] sm:border-ink sm:shadow-[0_40px_80px_-30px_rgb(22_24_27/0.45),0_0_0_1px_rgb(22_24_27/0.08)]',
        )}
      >
        <StatusBar />
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        <div
          aria-hidden="true"
          className="hidden h-7 shrink-0 items-center justify-center sm:flex"
        >
          <span className="h-[5px] w-32 rounded-full bg-ink/85" />
        </div>
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-11 shrink-0 items-center justify-between px-7 text-[0.9375rem] font-semibold text-ink sm:flex"
    >
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
export function PhoneScreen({
  children,
  footer,
  className,
}: {
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-3 pb-6',
          className,
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="shrink-0 border-t border-line/70 bg-paper px-5 pt-4 pb-5">
          {footer}
        </div>
      )}
    </>
  )
}
