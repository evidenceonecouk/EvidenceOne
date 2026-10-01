import { useFitScale } from '@/hooks/useFitScale'
import { CaseReviewWindow } from './CaseReviewWindow'
import { PhoneChipScan } from './PhoneChipScan'

const BASE_W = 1310
const BASE_H = 640

/*
  Hero product shot on a graphite stage: the ACSP case review with the
  individual's chip scan in front. Built from real markup and scaled to fit.
*/
export function ProductStage() {
  const { ref, scale } = useFitScale<HTMLDivElement>(BASE_W)
  return (
    <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
      <figure
        className="grain relative overflow-hidden rounded-[28px] bg-[#111214] px-4 pt-10 sm:px-10 sm:pt-16"
        aria-label="The ACSP case review screen, with the passport chip scan in the Evidence One app"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_0%,rgb(214_219_224/0.30),transparent_70%),radial-gradient(35%_40%_at_88%_100%,rgb(255_255_255/0.10),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <div ref={ref} aria-hidden="true" className="relative mx-auto hidden w-full max-w-[1310px] sm:block" style={{ height: BASE_H * scale }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}>
            <div className="absolute top-0 right-0">
              <CaseReviewWindow />
            </div>
            <div className="absolute bottom-[-60px] left-0 z-10">
              <PhoneChipScan />
            </div>
          </div>
        </div>
        {/* Small screens: the app on its own, at full size */}
        <div aria-hidden="true" className="relative -mb-24 flex justify-center sm:hidden">
          <PhoneChipScan />
        </div>
      </figure>
    </div>
  )
}
