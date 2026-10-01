import { CompletionTick } from '@/components/brand/CompletionTick'
import {
  CardBack,
  CardFront,
  PassportDataPage,
} from '@/components/visual/IdDocumentMockup'
import type { PortraitLook } from '@/data/portraits'
import {
  CARD_MRZ_ZONE,
  PASSPORT_MRZ_ZONE,
  type DocumentFacts,
} from '@/lib/idDocument'
import { cn } from '@/lib/utils'
import { CAMERA_OK } from './camera'
import type { ScanPhase } from './timings'

const span = (p: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (p - from) / (to - from)))

/*
  Camera view for the photo page step. The specimen document starts tilted, as if
  hand held, squares up inside the frame, and is read: a scan line over the page,
  then the machine-readable zone character by character. Cards are turned over.
*/
export function DocumentScan({
  facts,
  look,
  progress,
  phase,
}: {
  facts: DocumentFacts
  look: PortraitLook
  progress: number
  phase: ScanPhase
}) {
  const isPassport = facts.type === 'passport'
  const aligned = phase !== 'idle' && phase !== 'align'
  const flipped =
    !isPassport &&
    (phase === 'back' ||
      phase === 'capture' ||
      phase === 'done' ||
      (phase === 'turn' && progress >= 46))
  const zone = isPassport ? PASSPORT_MRZ_ZONE : CARD_MRZ_ZONE
  const backHasMrz = facts.type !== 'driving_licence'
  const line =
    phase === 'page'
      ? span(progress, 12, 55)
      : phase === 'front'
        ? span(progress, 8, 38)
        : phase === 'back' && !backHasMrz
          ? span(progress, 58, 92)
          : null
  const mrz =
    phase === 'mrz'
      ? span(progress, 55, 90)
      : phase === 'back' && backHasMrz
        ? span(progress, 58, 90)
        : null

  return (
    <div className="relative mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-[#101113] [perspective:900px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgb(255_255_255/0.09),transparent_72%)]"
      />

      <div
        className="relative w-[84%]"
        style={{ aspectRatio: isPassport ? '500 / 352' : '428 / 270' }}
        aria-hidden="true"
      >
        {/* The document: floats while waiting, then squares up into the frame */}
        <div
          className={cn(
            'absolute inset-0',
            phase === 'idle' && 'animate-doc-float',
          )}
        >
          <div
            className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.2,1)] [transform-style:preserve-3d]"
            style={{
              transform: aligned
                ? flipped
                  ? 'rotateY(180deg)'
                  : 'none'
                : 'rotateX(22deg) rotateZ(-8deg) translateY(6%) scale(0.86)',
            }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-[3.5%] shadow-[0_24px_40px_-18px_rgb(0_0_0/0.8)] [backface-visibility:hidden]">
              {isPassport ? (
                <PassportDataPage facts={facts} look={look} />
              ) : (
                <CardFront facts={facts} look={look} />
              )}
            </div>
            {!isPassport && (
              <div className="absolute inset-0 overflow-hidden rounded-[3.5%] shadow-[0_24px_40px_-18px_rgb(0_0_0/0.8)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <CardBack facts={facts} />
              </div>
            )}
          </div>
        </div>

        {/* Frame corners: white while searching, green once the document is square in the frame */}
        {(
          [
            'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
            'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
            'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
            'right-0 bottom-0 border-r-[3px] border-b-[3px] rounded-br-xl',
          ] as const
        ).map((c) => (
          <span
            key={c}
            className={cn(
              'absolute size-7 transition-[border-color,transform] duration-300',
              c,
              aligned ? '' : 'scale-125',
            )}
            style={{
              borderColor: aligned && phase !== 'done' ? CAMERA_OK : '#ffffff',
              margin: '-7px',
            }}
          />
        ))}

        {line !== null && (
          <div
            className="absolute inset-x-0 h-0.5 bg-white shadow-[0_0_18px_3px_rgb(255_255_255/0.6)]"
            style={{ top: `${line * 100}%` }}
          />
        )}

        {mrz !== null && (
          <div
            className="absolute inset-x-[2%] overflow-hidden rounded-md border-2"
            style={{
              top: `${zone.top * 100}%`,
              bottom: `${(1 - zone.bottom) * 100}%`,
              borderColor: CAMERA_OK,
            }}
          >
            <div
              className="h-full bg-white/35 mix-blend-screen"
              style={{ width: `${mrz * 100}%` }}
            />
          </div>
        )}

        {phase === 'turn' && progress < 46 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="animate-rise rounded-full bg-black/70 px-3.5 py-1.5 text-[0.9375rem] font-medium text-white [animation-duration:300ms]">
              Turn it over
            </span>
          </div>
        )}

        {phase === 'capture' && (
          <div className="animate-shutter absolute -inset-8 bg-white" />
        )}

        {phase === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[3.5%] bg-black/30">
            <CompletionTick
              className="size-12 animate-[tick-in_240ms_cubic-bezier(0.23,1,0.32,1)]"
              label="Captured"
            />
          </div>
        )}
      </div>
    </div>
  )
}
