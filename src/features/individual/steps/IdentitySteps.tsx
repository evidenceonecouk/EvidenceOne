import { BookUser, Car, ChevronRight, CreditCard, IdCard, Loader2, ScanFace, UserRoundCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { useProgress } from '@/hooks/useProgress'
import { cn } from '@/lib/utils'
import { requestOption2, updateJourney } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { reviewerOrgName } from '@/store/selectors'
import type { IdDocumentType } from '@/types/domain'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'

const documents: { type: IdDocumentType; label: string; note: string; icon: typeof BookUser }[] = [
  { type: 'passport', label: 'Passport', note: 'Recommended. The chip is read by your phone.', icon: BookUser },
  { type: 'driving_licence', label: 'Photocard driving licence', note: 'UK, Channel Islands, Isle of Man or EU', icon: Car },
  { type: 'national_identity_card', label: 'National identity card', note: 'EU, Norway, Iceland or Liechtenstein', icon: IdCard },
  { type: 'biometric_residence_permit', label: 'Biometric residence permit', note: 'Up to 18 months expired is accepted', icon: CreditCard },
]

export function DocumentStep({ vc, person, next, go }: StepProps) {
  const { apply } = useDemoStore()
  const [type, setType] = useState<IdDocumentType>(vc.journey?.documentType ?? person.document?.type ?? 'passport')
  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) => updateJourney(d, vc.id, { documentType: type }))
              next()
            }}
          >
            Continue with {documents.find((d) => d.type === type)?.label.toLowerCase()}
          </Button>
          <Button className="w-full" variant="ghost" onClick={() => go('option-2')}>
            My document is not listed
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Identity document">Verify with just one document</ScreenTitle>
      <Lead>Choose the photo ID you have with you. A passport is quickest.</Lead>
      <fieldset className="mt-5 space-y-2.5">
        <legend className="sr-only">Identity document</legend>
        {documents.map((d) => (
          <label
            key={d.type}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
              type === d.type ? 'border-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line',
            )}
          >
            <input type="radio" name="doc" className="sr-only" checked={type === d.type} onChange={() => setType(d.type)} />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
              <d.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-ink">{d.label}</span>
              <span className="block text-[0.875rem] leading-snug text-slate">{d.note}</span>
            </span>
            <span aria-hidden="true" className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]', type === d.type ? 'border-ink' : 'border-silver')}>
              {type === d.type && <span className="size-2.5 rounded-full bg-ink" />}
            </span>
          </label>
        ))}
      </fieldset>
    </Screen>
  )
}

/** Dark camera viewfinder used for document and face capture. */
function Viewfinder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-[#101113]', className)}>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,rgb(255_255_255/0.08),transparent_70%)]" />
      {children}
    </div>
  )
}

export function ScanStep({ vc, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.photoPageDone
  const progress = useProgress(2600, running)
  const done = already || progress >= 100
  const isPassport = (vc.journey?.documentType ?? 'passport') === 'passport'

  useEffect(() => {
    if (!done || already) return
    apply((d) => updateJourney(d, vc.id, { photoPageDone: true }, { action: 'document.captured', detail: isPassport ? 'Passport photo page captured. Machine-readable zone read.' : 'Identity document captured, front and back.' }))
  }, [done, already, apply, vc.id, isPassport])

  return (
    <Screen
      footer={
        done ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button className="w-full disabled:opacity-100" size="lg" disabled={running} onClick={() => setRunning(true)}>
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {running ? 'Hold steady' : isPassport ? 'Scan the photo page' : 'Scan my document'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Photo page">{isPassport ? 'Place the photo page in the frame' : 'Place your document in the frame'}</ScreenTitle>
      <Viewfinder>
        <div className="relative h-[62%] w-[82%] rounded-xl border-2 border-dashed border-white/40">
          <span className="absolute -top-0.5 -left-0.5 size-6 rounded-tl-xl border-t-[3px] border-l-[3px] border-white" />
          <span className="absolute -top-0.5 -right-0.5 size-6 rounded-tr-xl border-t-[3px] border-r-[3px] border-white" />
          <span className="absolute -bottom-0.5 -left-0.5 size-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute -right-0.5 -bottom-0.5 size-6 rounded-br-xl border-r-[3px] border-b-[3px] border-white" />
          {/* Document silhouette */}
          <div className={cn('absolute inset-2 rounded-lg bg-white/[0.07] transition-opacity duration-500', running ? 'opacity-100' : 'opacity-40')}>
            <div className="absolute top-3 left-3 h-[45%] w-[26%] rounded-md bg-white/15" />
            <div className="absolute top-4 right-3 left-[34%] space-y-1.5">
              <div className="h-1.5 w-3/4 rounded bg-white/20" />
              <div className="h-1.5 w-1/2 rounded bg-white/20" />
              <div className="h-1.5 w-2/3 rounded bg-white/20" />
            </div>
            <div className="absolute right-3 bottom-3 left-3 space-y-1 font-mono text-[7px] leading-none tracking-[0.18em] text-white/45">
              <p>P&lt;GBR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
              <p>&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;GBR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
            </div>
          </div>
          {running && !done && <div className="absolute inset-x-1 h-0.5 bg-white shadow-[0_0_16px_2px_rgb(255_255_255/0.55)]" style={{ top: `${8 + (progress % 50) * 1.7}%` }} />}
          {done && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CompletionTick className="size-12" label="Captured" />
            </div>
          )}
        </div>
      </Viewfinder>
      <p className="mt-4 text-[0.9375rem] text-graphite" role="status">
        {done ? 'Captured. We will reuse this for every check, so you will not upload it again.' : running ? 'Reading the machine-readable zone' : 'Good light, no glare, all four corners visible.'}
      </p>
    </Screen>
  )
}

const chipItems = [
  { at: 30, label: 'Secure connection to the chip' },
  { at: 60, label: 'Chip signature validated' },
  { at: 85, label: 'Photo read from the chip' },
  { at: 100, label: 'Personal details read' },
]

export function ChipStep({ vc, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.chipDone
  const progress = useProgress(4200, running)
  const done = already || progress >= 100

  useEffect(() => {
    if (!done || already) return
    apply((d) => updateJourney(d, vc.id, { chipDone: true }, { action: 'document.chip_read', detail: 'Passport chip read in the app. Digital signature validated by the certified identity provider.', actorType: 'system' }))
  }, [done, already, apply, vc.id])

  return (
    <Screen
      footer={
        done ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button className="w-full disabled:opacity-100" size="lg" disabled={running} onClick={() => setRunning(true)}>
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {running ? 'Keep holding still' : 'Start chip scan'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Passport chip">Hold your passport to the back of your phone</ScreenTitle>
      <div className="relative mx-auto mt-7 flex size-44 items-center justify-center">
        {running && !done && (
          <>
            <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25" />
            <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25 [animation-delay:0.8s]" />
            <span className="animate-nfc absolute inset-0 rounded-full border border-ink/25 [animation-delay:1.6s]" />
          </>
        )}
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${((done ? 100 : progress) / 100) * 289} 289`} />
        </svg>
        <span className="relative flex h-[104px] w-[76px] flex-col justify-between rounded-[12px] bg-ink p-3 shadow-lg">
          <span className="h-[3px] w-7 rounded-full bg-paper/30" />
          <span className="mx-auto grid size-8 grid-cols-2 gap-[2px] rounded-[5px] border border-highlight/70 p-[3px]">
            <i className="rounded-[1px] bg-highlight/80" />
            <i className="rounded-[1px] bg-highlight/80" />
            <i className="rounded-[1px] bg-highlight/80" />
            <i className="rounded-[1px] bg-highlight/80" />
          </span>
          <span className="text-center font-mono text-[7px] tracking-[0.2em] text-paper/60">PASSPORT</span>
        </span>
      </div>
      <p className="mt-4 text-center font-mono text-[0.9375rem] text-ink tabular" role="status" aria-live="polite">
        {done ? 'Chip read' : running ? `Reading chip ${Math.floor(progress)}%` : 'Ready'}
      </p>
      <ul className="mt-5 space-y-2.5">
        {chipItems.map((c) => {
          const ok = done || progress >= c.at
          return (
            <li key={c.label} className={cn('flex items-center gap-3 text-[0.9375rem] transition-colors duration-300', ok ? 'text-ink' : 'text-slate')}>
              {ok ? <CompletionTick className="size-5 animate-[tick-in_240ms_cubic-bezier(0.23,1,0.32,1)]" label="Done" /> : <span className="size-5 rounded-full border-[1.5px] border-line" aria-hidden="true" />}
              {c.label}
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}

const prompts = ['Look straight at the camera', 'Turn your head slowly to the left', 'Now slowly to the right', 'Blink once']

export function SelfieStep({ vc, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.selfieDone
  const progress = useProgress(4800, running)
  const done = already || progress >= 100
  const prompt = prompts[Math.min(prompts.length - 1, Math.floor(progress / 25))]

  useEffect(() => {
    if (!done || already) return
    apply((d) => updateJourney(d, vc.id, { selfieDone: true }, { action: 'liveness.captured', detail: 'Selfie video captured for liveness and face match.' }))
  }, [done, already, apply, vc.id])

  return (
    <Screen
      footer={
        done ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button className="w-full disabled:opacity-100" size="lg" disabled={running} onClick={() => setRunning(true)}>
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {running ? 'Recording' : 'Start selfie video'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Selfie video">Show us it is really you</ScreenTitle>
      <Viewfinder className="aspect-[4/4.4]">
        <div
          className="relative flex h-[78%] w-[62%] items-center justify-center rounded-[50%]"
          style={{ background: `conic-gradient(#ffffff ${(done ? 100 : progress) * 3.6}deg, rgb(255 255 255 / 0.18) 0deg)` }}
        >
          <div className="flex size-[calc(100%-8px)] items-center justify-center rounded-[50%] bg-[#1b1d20]">
            {done ? <CompletionTick className="size-12" label="Recorded" /> : <ScanFace className="size-16 text-white/35" strokeWidth={1.25} aria-hidden="true" />}
          </div>
        </div>
      </Viewfinder>
      <p className="mt-4 text-center text-lg text-ink" role="status" aria-live="polite">
        {done ? 'All done' : running ? prompt : 'Remove glasses and find good light'}
      </p>
    </Screen>
  )
}

const checks = [
  { label: 'Document is genuine', by: 'Certified identity provider' },
  { label: 'You are a live person', by: 'Certified identity provider' },
  { label: 'Your face matches the document', by: 'Certified identity provider' },
  { label: 'PEP and sanctions screening', by: 'Certified identity provider' },
  { label: 'Details compared with the register', by: 'Evidence One Intelligence, advisory' },
]

export function ChecksStep({ vc, next }: StepProps) {
  const { apply } = useDemoStore()
  const [resolved, setResolved] = useState(vc.journey?.checksDone ? checks.length : 0)
  const done = resolved >= checks.length

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => setResolved((r) => r + 1), 750)
    return () => window.clearTimeout(id)
  }, [resolved, done])

  useEffect(() => {
    if (done && !vc.journey?.checksDone) apply((d) => updateJourney(d, vc.id, { checksDone: true }))
  }, [done, apply, vc.id, vc.journey?.checksDone])

  return (
    <Screen
      footer={
        <Button className="w-full disabled:opacity-100" size="lg" disabled={!done} onClick={next}>
          {!done && <Loader2 className="animate-spin" aria-hidden="true" />}
          {done ? 'Continue' : 'Checking'}
          {done && <ChevronRight aria-hidden="true" />}
        </Button>
      }
    >
      <ScreenTitle kicker="Checks">{done ? 'Your identity checks are complete' : 'Checking your identity'}</ScreenTitle>
      <Lead>This usually takes a few seconds. You do not need to do anything.</Lead>
      <ul className="mt-6 space-y-3" aria-live="polite">
        {checks.map((c, i) => {
          const ok = i < resolved
          const active = i === resolved
          return (
            <li key={c.label} className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
              {ok ? (
                <CompletionTick className="mt-0.5 size-5" label="Passed" />
              ) : active ? (
                <Loader2 className="mt-0.5 size-5 animate-spin text-ink" aria-label="In progress" />
              ) : (
                <span className="mt-0.5 size-5 rounded-full border-[1.5px] border-line" aria-hidden="true" />
              )}
              <span>
                <span className={cn('block text-base', ok || active ? 'text-ink' : 'text-slate')}>{c.label}</span>
                <span className="block text-[0.875rem] text-slate">{c.by}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}

export function OptionTwoStep({ vc, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const acsp = reviewerOrgName(data, vc.acspId)
  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) => requestOption2(d, vc.id))
              go('status')
            }}
          >
            <UserRoundCheck aria-hidden="true" />
            Ask for a human check
          </Button>
          <Button className="w-full" variant="ghost" onClick={() => go('document')}>
            Back to document choice
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Option 2 · Fallback">Your document cannot be checked digitally</ScreenTitle>
      <Lead>
        If none of the listed documents will work for you, a trained person at {acsp} can check your identity instead. They will contact you to arrange it.
      </Lead>
      <ul className="mt-5 space-y-2.5 text-[0.9375rem] text-graphite">
        <li className="rounded-2xl border border-line bg-white px-4 py-3">You may be asked for more than one document.</li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">The check is recorded in your case like any other.</li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">The decision is still made by the ACSP.</li>
      </ul>
    </Screen>
  )
}
