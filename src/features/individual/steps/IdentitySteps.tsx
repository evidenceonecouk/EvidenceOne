import {
  BookUser,
  Car,
  ChevronRight,
  CreditCard,
  IdCard,
  Loader2,
  MonitorSmartphone,
  SmartphoneNfc,
  UserRoundCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { portraitFor } from '@/data/portraits'
import { useProgress } from '@/hooks/useProgress'
import { useSequence } from '@/hooks/useSequence'
import { documentFacts } from '@/lib/idDocument'
import { cn } from '@/lib/utils'
import { requestOption2, updateJourney } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { reviewerOrgName } from '@/store/selectors'
import type { IdDocumentType } from '@/types/domain'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'
import { ChipRead } from '../visuals/ChipRead'
import { DocumentScan } from '../visuals/DocumentScan'
import {
  livenessBeat,
  livenessBeats,
  livenessChecks,
  livenessDurations,
} from '../visuals/liveness'
import { LivenessCamera } from '../visuals/SelfieLiveness'
import {
  CHIP_AT,
  CHIP_DURATION,
  scanDuration,
  scanPhase,
} from '../visuals/timings'

const documents: {
  type: IdDocumentType
  label: string
  note: string
  icon: typeof BookUser
}[] = [
  {
    type: 'passport',
    label: 'Passport',
    note: 'Recommended. The chip is read by your phone.',
    icon: BookUser,
  },
  {
    type: 'driving_licence',
    label: 'Photocard driving licence',
    note: 'UK, Channel Islands, Isle of Man or EU',
    icon: Car,
  },
  {
    type: 'national_identity_card',
    label: 'National identity card',
    note: 'EU, Norway, Iceland or Liechtenstein',
    icon: IdCard,
  },
  {
    type: 'biometric_residence_permit',
    label: 'Biometric residence permit',
    note: 'Up to 18 months expired is accepted',
    icon: CreditCard,
  },
]

export function DocumentStep({ vc, person, next, go }: StepProps) {
  const { apply } = useDemoStore()
  const [type, setType] = useState<IdDocumentType>(
    vc.journey?.documentType ?? person.document?.type ?? 'passport',
  )
  const [noChip, setNoChip] = useState(false)

  if (noChip) {
    return (
      <Screen
        footer={
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                apply((d) =>
                  updateJourney(
                    d,
                    vc.id,
                    { documentType: 'driving_licence', noChipPhone: true },
                    {
                      action: 'document.no_chip_phone',
                      detail:
                        'Phone cannot read the passport chip. UK photocard driving licence offered in the browser.',
                    },
                  ),
                )
                next()
              }}
            >
              <MonitorSmartphone aria-hidden="true" />
              Use my driving licence instead
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                apply((d) => requestOption2(d, vc.id, 'no_chip_phone'))
                go('status')
              }}
            >
              I don’t have a photocard driving licence
            </Button>
          </>
        }
      >
        <ScreenTitle kicker="Passport chip">
          Your phone can’t read the chip
        </ScreenTitle>
        <Lead>
          You can use a UK photocard driving licence instead. It is checked in
          your browser, without a chip read.
        </Lead>
        <div className="mt-5 rounded-2xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-base font-medium text-ink">
            <Car className="size-5" aria-hidden="true" />
            UK photocard driving licence
          </p>
          <p className="mt-1 text-[0.9375rem] text-slate">
            Full or provisional, in date. If the address on it is your current
            address, you will not need anything else.
          </p>
        </div>
        <p className="mt-4 text-[0.9375rem] text-graphite">
          If you do not have one, a trained person at your ACSP can check your
          identity instead (Option 2). That needs the reviewer’s agreement
          first.
        </p>
        <Button
          variant="link"
          className="mt-2 px-0"
          onClick={() => setNoChip(false)}
        >
          Back to document choice
        </Button>
      </Screen>
    )
  }

  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) =>
                updateJourney(d, vc.id, {
                  documentType: type,
                  noChipPhone: false,
                }),
              )
              next()
            }}
          >
            Continue with{' '}
            {documents.find((d) => d.type === type)?.label.toLowerCase()}
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => go('option-2')}
          >
            My document is not listed
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Identity document">
        Verify with just one document
      </ScreenTitle>
      <Lead>
        Choose one photo ID. You upload it once and it goes straight to the
        checks.
      </Lead>
      <fieldset className="mt-5 space-y-2.5">
        <legend className="sr-only">Identity document</legend>
        {documents.map((d) => (
          <label
            key={d.type}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
              type === d.type
                ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
                : 'border-line',
            )}
          >
            <input
              type="radio"
              name="doc"
              className="sr-only"
              checked={type === d.type}
              onChange={() => setType(d.type)}
            />
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
              <d.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-ink">
                {d.label}
              </span>
              <span className="block text-[0.875rem] leading-snug text-slate">
                {d.note}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                type === d.type ? 'border-ink' : 'border-silver',
              )}
            >
              {type === d.type && (
                <span className="size-2.5 rounded-full bg-ink" />
              )}
            </span>
          </label>
        ))}
      </fieldset>
      {type === 'passport' && (
        <button
          type="button"
          onClick={() => setNoChip(true)}
          className="mt-4 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-silver bg-paper px-4 py-3 text-left text-[0.9375rem] text-ink hover:bg-mist"
        >
          <SmartphoneNfc className="size-5 shrink-0" aria-hidden="true" />
          My phone can’t read the chip
        </button>
      )}
    </Screen>
  )
}

export function ScanStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.photoPageDone
  const type = vc.journey?.documentType ?? 'passport'
  const isPassport = type === 'passport'
  const progress = useProgress(scanDuration(isPassport), running)
  const done = already || progress >= 100
  const phase = scanPhase(progress, isPassport, running, done)
  const facts = useMemo(() => documentFacts(person, type), [person, type])

  useEffect(() => {
    if (!done || already) return
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        { photoPageDone: true },
        {
          action: 'document.captured',
          detail: isPassport
            ? 'Passport photo page captured. Machine-readable zone read.'
            : 'Identity document captured, front and back.',
        },
      ),
    )
  }, [done, already, apply, vc.id, isPassport])

  const status: Record<typeof phase, string> = {
    idle: 'Good light, no glare, all four corners visible.',
    align: isPassport
      ? 'Hold the page flat inside the frame'
      : 'Hold the card flat inside the frame',
    page: 'Reading the photo page',
    mrz: 'Reading the machine-readable zone',
    front: 'Reading the front',
    turn: 'Now turn it over',
    back:
      type === 'driving_licence'
        ? 'Reading the back'
        : 'Reading the machine-readable zone',
    capture: 'Hold steady',
    done: 'Captured. We will reuse this for every check, so you will not upload it again.',
  }

  return (
    <Screen
      footer={
        done ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={running}
            onClick={() => setRunning(true)}
          >
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {running
              ? 'Hold steady'
              : isPassport
                ? 'Scan the photo page'
                : 'Scan my document'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Photo page">
        {isPassport
          ? 'Place the photo page in the frame'
          : 'Place your document in the frame'}
      </ScreenTitle>
      <DocumentScan
        facts={facts}
        look={portraitFor(person)}
        progress={progress}
        phase={phase}
      />
      <p className="mt-4 text-[0.9375rem] text-graphite" role="status">
        {status[phase]}
      </p>
    </Screen>
  )
}

const chipItems = [
  { at: CHIP_AT.connected, label: 'Secure connection to the chip' },
  { at: CHIP_AT.signature, label: 'Chip signature validated' },
  { at: CHIP_AT.photo, label: 'Photo read from the chip' },
  { at: CHIP_AT.details, label: 'Personal details read' },
]

export function ChipStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.chipDone
  const progress = useProgress(CHIP_DURATION, running)
  const done = already || progress >= 100
  const facts = useMemo(() => documentFacts(person, 'passport'), [person])
  const label = done
    ? 'Chip read'
    : !running
      ? 'Ready'
      : progress < CHIP_AT.connected
        ? 'Connecting to the chip'
        : progress < CHIP_AT.signature
          ? 'Checking the chip signature'
          : progress < CHIP_AT.photo
            ? 'Reading your photo'
            : 'Reading your details'

  useEffect(() => {
    if (!done || already) return
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        { chipDone: true },
        {
          action: 'document.chip_read',
          detail:
            'Passport chip read in the app. Digital signature validated by the certified identity provider.',
          actorType: 'system',
        },
      ),
    )
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
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={running}
            onClick={() => setRunning(true)}
          >
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {running ? 'Keep holding still' : 'Start chip scan'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Passport chip">
        Hold your passport to the back of your phone
      </ScreenTitle>
      <ChipRead
        facts={facts}
        look={portraitFor(person)}
        progress={progress}
        running={running}
        done={done}
      />
      <div className="mt-4">
        <p className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
          <span className="text-ink" role="status" aria-live="polite">
            {label}
          </span>
          {(running || done) && (
            <span className="font-mono text-slate tabular" aria-hidden="true">
              {Math.floor(done ? 100 : progress)}%
            </span>
          )}
        </p>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-ink"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {chipItems.map((c) => {
          const ok = done || progress >= c.at
          return (
            <li
              key={c.label}
              className={cn(
                'flex items-center gap-3 text-[0.9375rem] transition-colors duration-300',
                ok ? 'text-ink' : 'text-slate',
              )}
            >
              {ok ? (
                <CompletionTick
                  className="size-5 animate-[tick-in_240ms_cubic-bezier(0.23,1,0.32,1)]"
                  label="Done"
                />
              ) : (
                <span
                  className="size-5 rounded-full border-[1.5px] border-line"
                  aria-hidden="true"
                />
              )}
              {c.label}
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}

export function SelfieStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const [running, setRunning] = useState(false)
  const already = !!vc.journey?.selfieDone
  const index = useSequence(livenessDurations, running)
  const done = already || index >= livenessBeats.length
  const beat = livenessBeat(index, done)
  const recording = beat?.ring === 'rec'

  useEffect(() => {
    if (!done || already) return
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        { selfieDone: true },
        {
          action: 'liveness.captured',
          detail: 'Selfie video captured for liveness and face match.',
        },
      ),
    )
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
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={running}
            onClick={() => setRunning(true)}
          >
            {running && <Loader2 className="animate-spin" aria-hidden="true" />}
            {!running
              ? 'Start selfie video'
              : recording
                ? 'Recording'
                : 'Checking the picture'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Selfie video">Show us it is really you</ScreenTitle>
      <LivenessCamera look={portraitFor(person)} beat={beat} />
      <p
        className="mt-4 min-h-[3.5rem] text-center text-lg leading-snug text-ink"
        role="status"
        aria-live="polite"
      >
        {beat?.prompt ?? 'Remove glasses and find good light'}
      </p>
      <ul
        className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2.5"
        aria-label="Selfie checks"
      >
        {livenessChecks.map((c) => {
          const ok = done || index >= c.doneAt
          return (
            <li
              key={c.label}
              className={cn(
                'flex items-center gap-2.5 text-[0.9375rem] transition-colors duration-300',
                ok ? 'text-ink' : 'text-slate',
              )}
            >
              {ok ? (
                <CompletionTick
                  className="size-5 animate-[tick-in_240ms_cubic-bezier(0.23,1,0.32,1)]"
                  label="Done"
                />
              ) : (
                <span
                  className="size-5 shrink-0 rounded-full border-[1.5px] border-line"
                  aria-hidden="true"
                />
              )}
              {c.label}
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}

const checks = [
  { label: 'Document is genuine', by: 'Certified identity provider' },
  { label: 'You are a live person', by: 'Certified identity provider' },
  {
    label: 'Your face matches the document',
    by: 'Certified identity provider',
  },
  { label: 'PEP and sanctions screening', by: 'Certified identity provider' },
  {
    label: 'Details compared with the register',
    by: 'Evidence One rules, the same way every time',
  },
]

export function ChecksStep({ vc, next }: StepProps) {
  const { apply } = useDemoStore()
  const [resolved, setResolved] = useState(
    vc.journey?.checksDone ? checks.length : 0,
  )
  const done = resolved >= checks.length

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => setResolved((r) => r + 1), 750)
    return () => window.clearTimeout(id)
  }, [resolved, done])

  useEffect(() => {
    if (done && !vc.journey?.checksDone)
      apply((d) => updateJourney(d, vc.id, { checksDone: true }))
  }, [done, apply, vc.id, vc.journey?.checksDone])

  return (
    <Screen
      footer={
        <Button
          className="w-full disabled:opacity-100"
          size="lg"
          disabled={!done}
          onClick={next}
        >
          {!done && <Loader2 className="animate-spin" aria-hidden="true" />}
          {done ? 'Continue' : 'Checking'}
          {done && <ChevronRight aria-hidden="true" />}
        </Button>
      }
    >
      <ScreenTitle kicker="Checks">
        {done ? 'Your identity checks are complete' : 'Checking your identity'}
      </ScreenTitle>
      <Lead>
        This usually takes a few seconds. You do not need to do anything.
      </Lead>
      <ul className="mt-6 space-y-3" aria-live="polite">
        {checks.map((c, i) => {
          const ok = i < resolved
          const active = i === resolved
          return (
            <li
              key={c.label}
              className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5"
            >
              {ok ? (
                <CompletionTick className="mt-0.5 size-5" label="Passed" />
              ) : active ? (
                <Loader2
                  className="mt-0.5 size-5 animate-spin text-ink"
                  aria-label="In progress"
                />
              ) : (
                <span
                  className="mt-0.5 size-5 rounded-full border-[1.5px] border-line"
                  aria-hidden="true"
                />
              )}
              <span>
                <span
                  className={cn(
                    'block text-base',
                    ok || active ? 'text-ink' : 'text-slate',
                  )}
                >
                  {c.label}
                </span>
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
              apply((d) => requestOption2(d, vc.id, 'unsupported_document'))
              go('status')
            }}
          >
            <UserRoundCheck aria-hidden="true" />
            Ask for a person check
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => go('document')}
          >
            Back to document choice
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Option 2 · Fallback only">
        Your document can’t be checked digitally
      </ScreenTitle>
      <Lead>
        The digital checks (Option 1) cannot support your document. A trained
        person at {acsp} can check your identity instead. They will contact you
        to arrange it.
      </Lead>
      <ul className="mt-5 space-y-2.5 text-[0.9375rem] text-graphite">
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          You will need two documents: two from Group A, or one from Group A and
          one from Group B.
        </li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          The person who checks them holds a current training attestation.
        </li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          The decision is still made by the ACSP, and recorded in your case like
          any other.
        </li>
      </ul>
    </Screen>
  )
}
