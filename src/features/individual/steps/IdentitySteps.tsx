import {
  BookUser,
  Car,
  ChevronRight,
  CreditCard,
  Flag,
  IdCard,
  Loader2,
  MinusCircle,
  Nfc,
  UserRoundCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { portraitFor } from '@/data/portraits'
import { useProgress } from '@/hooks/useProgress'
import { useSequence } from '@/hooks/useSequence'
import { documentFacts } from '@/lib/idDocument'
import { hasChipStep } from '@/lib/chip'
import { DOCUMENT_LABEL, planChecks } from '@/lib/identityChecks'
import { formatDate } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { requestOption2 } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  chooseDocument,
  recordCheckFailure,
  recordChipResult,
  recordDocumentCapture,
  recordLivenessCapture,
  recordPhoneJourney,
  switchDocument,
} from '@/store/identityActions'
import { reviewerOrgName } from '@/store/selectors'
import type { IdDocumentType } from '@/types/domain'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'
import { DocumentScan } from '../visuals/DocumentScan'
import {
  livenessBeat,
  livenessBeats,
  livenessChecks,
  livenessDurations,
} from '../visuals/liveness'
import { PhoneHandoff } from '../visuals/PhoneHandoff'
import { ProviderLabel } from '../visuals/ProviderLabel'
import { LivenessCamera } from '../visuals/SelfieLiveness'
import { scanDuration, scanPhase } from '../visuals/timings'
import { useViewMode } from '../visuals/viewMode'

const documents: {
  type: IdDocumentType
  label: string
  note: string
  icon: typeof BookUser
}[] = [
  {
    type: 'passport',
    label: 'Passport',
    note: 'From any country. If it has a chip, the identity provider’s chip reader reads it.',
    icon: BookUser,
  },
  {
    type: 'driving_licence',
    label: 'Photocard driving licence',
    note: 'UK. Captured with a phone or tablet camera.',
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
    note: 'A card, not an eVisa',
    icon: CreditCard,
  },
]

function RadioMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
        on ? 'border-ink' : 'border-silver',
      )}
    >
      {on && <span className="size-2.5 rounded-full bg-ink" />}
    </span>
  )
}

export function DocumentStep({ vc, next, person, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const brpMonths = currentRuleSet(data).params.brp_expiry
  const [type, setType] = useState<IdDocumentType>(
    vc.journey?.documentType ?? person.document?.type ?? 'passport',
  )
  const [eVisa, setEVisa] = useState(!!vc.journey?.eVisa)
  const chosen = eVisa ? 'passport' : type

  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) => chooseDocument(d, vc.id, chosen, eVisa))
              next()
            }}
          >
            {eVisa
              ? 'Continue with my eVisa'
              : `Continue with ${DOCUMENT_LABEL[chosen].toLowerCase()}`}
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => go('option-2')}
          >
            My document is not in this list
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Identity document">
        Verify with just one document
      </ScreenTitle>
      <Lead>
        Choose one photo ID. You add it once and it goes straight to the checks.
      </Lead>
      <ProviderLabel className="mt-3" />
      <fieldset className="mt-5 space-y-2.5">
        <legend className="sr-only">Identity document</legend>
        {documents.map((d) => {
          const on = !eVisa && type === d.type
          return (
            <label
              key={d.type}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                on ? 'border-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line',
              )}
            >
              <input
                type="radio"
                name="doc"
                className="sr-only"
                checked={on}
                onChange={() => {
                  setType(d.type)
                  setEVisa(false)
                }}
              />
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
                <d.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-ink">
                  {d.label}
                </span>
                <span className="block text-base leading-snug text-slate">
                  {d.type === 'biometric_residence_permit'
                    ? `${d.note}. Up to ${brpMonths} months expired is accepted.`
                    : d.note}
                </span>
              </span>
              <RadioMark on={on} />
            </label>
          )
        })}
        <label
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
            eVisa ? 'border-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line',
          )}
        >
          <input
            type="radio"
            name="doc"
            className="sr-only"
            checked={eVisa}
            onChange={() => setEVisa(true)}
          />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
            <BookUser className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-medium text-ink">eVisa</span>
            <span className="block text-base leading-snug text-slate">
              Checked with the Home Office. Have the passport linked to your
              eVisa ready.
            </span>
          </span>
          <RadioMark on={eVisa} />
        </label>
      </fieldset>
    </Screen>
  )
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <Button className="w-full" size="lg" onClick={onClick}>
      Continue
      <ChevronRight aria-hidden="true" />
    </Button>
  )
}

/*
  The certified identity provider needs a phone or tablet camera. On desktop
  the whole provider journey (document, chip where the document has one, and
  the selfie video) is finished on the phone or tablet, and this screen then
  shows the result. On mobile the capture is direct. There is no webcam-only
  route. The return to this case is simulated.
*/
export function ScanStep({ vc, person, next, go, viewMode }: StepProps) {
  const { apply } = useDemoStore()
  const mode = useViewMode(viewMode)
  const mobile = mode === 'mobile'
  const already = !!vc.journey?.photoPageDone
  const type = vc.journey?.documentType ?? 'passport'
  const isPassport = type === 'passport'
  const chipStep = hasChipStep(person.document, type)
  const [running, setRunning] = useState(false)
  const [receiving, setReceiving] = useState<'read' | 'not_read' | null>(null)
  const progress = useProgress(scanDuration(isPassport), running)
  const done = already || progress >= 100
  const phase = scanPhase(progress, isPassport, running, done)
  const facts = useMemo(() => documentFacts(person, type), [person, type])

  useEffect(() => {
    if (!mobile || !done || already) return
    apply((d) => recordDocumentCapture(d, vc.id, type, 'camera'))
  }, [mobile, done, already, apply, vc.id, type])

  useEffect(() => {
    if (!receiving) return
    const id = window.setTimeout(() => {
      apply((d) => recordPhoneJourney(d, vc.id, receiving))
      setReceiving(null)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [receiving, apply, vc.id])

  const toOption2 = () => {
    apply((d) => requestOption2(d, vc.id, 'no_smartphone'))
    go('status')
  }

  if (!mobile) {
    const returned =
      !!vc.journey?.photoPageDone && !!vc.journey?.selfieDone && !receiving
    if (returned) {
      const chip = vc.journey?.chipResult
      return (
        <Screen
          footer={
            <Button className="w-full" size="lg" onClick={() => go('checks')}>
              Continue
              <ChevronRight aria-hidden="true" />
            </Button>
          }
        >
          <ScreenTitle kicker="Identity document">
            We have your result, continue
          </ScreenTitle>
          <Lead>
            You finished on your phone and you are back in your case. You will
            not need to add anything again.
          </Lead>
          <ProviderLabel className="mt-3" />
          <ul
            className="mt-5 space-y-2.5"
            aria-label="Returned from your phone"
          >
            <ResultRow label={`${DOCUMENT_LABEL[type]} captured`} ok />
            {chipStep && (
              <ResultRow
                label={chip === 'not_read' ? 'No chip read' : 'Chip read'}
                ok={chip !== 'not_read'}
                note={
                  chip === 'not_read'
                    ? 'This does not stop your case. Your ACSP’s reviewer will decide.'
                    : undefined
                }
              />
            )}
            <ResultRow label="Selfie video recorded" ok />
          </ul>
        </Screen>
      )
    }
    return (
      <Screen>
        <ScreenTitle kicker="Identity document">
          Continue on your phone or tablet
        </ScreenTitle>
        <ProviderLabel className="mt-3" />
        <PhoneHandoff
          purpose="journey"
          caseId={vc.id}
          mobile={person.mobile}
          chipStep={chipStep}
          receiving={!!receiving}
          onReturn={() => setReceiving('read')}
          onChipNotRead={() => setReceiving('not_read')}
          onNoSmartphone={toOption2}
        />
      </Screen>
    )
  }

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
    done: 'Added. We reuse this for every check, so you will not add it again.',
  }

  return (
    <Screen
      footer={
        done ? (
          <ContinueButton onClick={next} />
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
      <ScreenTitle kicker="Identity document">
        {done
          ? 'Document added'
          : isPassport
            ? 'Place the photo page in the frame'
            : 'Place your document in the frame'}
      </ScreenTitle>
      <ProviderLabel className="mt-3" />
      <DocumentScan
        facts={facts}
        look={portraitFor(person)}
        progress={done ? 100 : progress}
        phase={done ? 'done' : phase}
      />
      <p className="mt-4 text-base text-graphite" role="status">
        {status[done ? 'done' : phase]}
      </p>
    </Screen>
  )
}

function ResultRow({
  label,
  ok,
  note,
}: {
  label: string
  ok: boolean
  note?: string
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5">
      {ok ? (
        <CompletionTick className="mt-0.5 size-5" label="Done" />
      ) : (
        <Flag
          className="mt-0.5 size-5 text-info"
          aria-label="Recorded for the reviewer"
        />
      )}
      <span>
        <span className="block text-base text-ink">{label}</span>
        {note && <span className="block text-base text-slate">{note}</span>}
      </span>
    </li>
  )
}

/*
  The chip step sits inside the certified identity provider's journey, after
  the document capture. The chip is read by the provider's own chip reader on
  the person's phone. Evidence One has no app and reads no chip. The return to
  this case is simulated; where the step sits is to be confirmed with the
  provider.
*/
export function ChipStep({ vc, person, next, viewMode }: StepProps) {
  const { apply } = useDemoStore()
  const mode = useViewMode(viewMode)
  const mobile = mode === 'mobile'
  const result = vc.journey?.chipResult
  const [receiving, setReceiving] = useState<'read' | 'not_read' | null>(null)

  useEffect(() => {
    if (!receiving) return
    const id = window.setTimeout(() => {
      apply((d) => recordChipResult(d, vc.id, receiving))
      setReceiving(null)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [receiving, apply, vc.id])

  const kicker = 'Identity document · Passport chip'
  const title =
    'Read your passport chip with the identity provider’s chip reader'

  if (result && !receiving)
    return (
      <Screen footer={<ContinueButton onClick={next} />}>
        <ScreenTitle kicker={kicker}>
          {result === 'read' ? 'Your passport chip was read' : 'No chip read'}
        </ScreenTitle>
        <ProviderLabel className="mt-3" />
        <ul className="mt-5 space-y-2.5">
          <ResultRow
            label={result === 'read' ? 'Chip read' : 'No chip read'}
            ok={result === 'read'}
            note={
              result === 'read'
                ? 'The identity provider’s chip reader read the chip. You are back in your case.'
                : 'You can continue. Your case records that no chip was read, and your ACSP’s reviewer will decide.'
            }
          />
        </ul>
      </Screen>
    )

  if (!mobile)
    return (
      <Screen>
        <ScreenTitle kicker={kicker}>{title}</ScreenTitle>
        <ProviderLabel className="mt-3" />
        <PhoneHandoff
          purpose="chip"
          caseId={vc.id}
          mobile={person.mobile}
          receiving={!!receiving}
          onReturn={() => setReceiving('read')}
          onChipNotRead={() => setReceiving('not_read')}
        />
      </Screen>
    )

  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={!!receiving}
            onClick={() => setReceiving('read')}
          >
            {receiving ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Nfc aria-hidden="true" />
            )}
            {receiving ? 'Reading the chip' : 'Open the chip reader'}
          </Button>
          {!receiving && (
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setReceiving('not_read')}
            >
              I cannot read the chip, continue without it
            </Button>
          )}
        </>
      }
    >
      <ScreenTitle kicker={kicker}>{title}</ScreenTitle>
      <ProviderLabel className="mt-3" />
      <Lead>
        Hold your passport flat against the back of this phone until it
        finishes. It takes a few seconds.
      </Lead>
      <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-base text-graphite">
        The chip reader belongs to the certified identity provider and opens on
        this phone. It is not an Evidence One app. You come straight back to
        this case.
      </p>
    </Screen>
  )
}

export function SelfieStep({ vc, person, next, viewMode }: StepProps) {
  const { apply } = useDemoStore()
  const mode = useViewMode(viewMode)
  const mobile = mode === 'mobile'
  const already = !!vc.journey?.selfieDone
  const [running, setRunning] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const attempts = vc.journey?.checkAttempts ?? 0
  const index = useSequence(livenessDurations, running)
  const done = already || index >= livenessBeats.length
  const beat = livenessBeat(index, done)
  const recording = beat?.ring === 'rec'

  useEffect(() => {
    if (!mobile || !done || already) return
    apply((d) => recordLivenessCapture(d, vc.id))
  }, [mobile, done, already, apply, vc.id])

  useEffect(() => {
    if (!receiving) return
    const id = window.setTimeout(() => {
      apply((d) => recordLivenessCapture(d, vc.id))
      setReceiving(false)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [receiving, apply, vc.id])

  const kicker = attempts
    ? `Selfie video, attempt ${attempts + 1} of 3`
    : 'Selfie video'

  // Desktop hands off to the phone or tablet. There is no webcam-only route.
  if (!done && !mobile)
    return (
      <Screen>
        <ScreenTitle kicker={kicker}>
          Continue on your phone or tablet
        </ScreenTitle>
        <ProviderLabel className="mt-3" />
        <PhoneHandoff
          purpose="liveness"
          caseId={vc.id}
          mobile={person.mobile}
          receiving={receiving}
          onReturn={() => setReceiving(true)}
        />
      </Screen>
    )

  return (
    <Screen
      footer={
        done ? (
          <ContinueButton onClick={next} />
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
      <ScreenTitle kicker={kicker}>Show us it is really you</ScreenTitle>
      <ProviderLabel className="mt-3" />
      {done && already && !mobile ? (
        <p className="mt-5 text-base text-graphite" role="status">
          Received from your phone. You are back in your case.
        </p>
      ) : (
        <LivenessCamera look={portraitFor(person)} beat={beat} />
      )}
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
                'flex items-center gap-2.5 text-base transition-colors duration-300',
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

export function ChecksStep({ vc, next, go, person }: StepProps) {
  const { data, state, apply } = useDemoStore()
  const plan = useMemo(() => planChecks(data, vc), [data, vc])
  const acsp = reviewerOrgName(data, vc.acspId) ?? 'your ACSP'
  const total = plan.rows.length
  const [resolved, setResolved] = useState(vc.journey?.checksDone ? total : 0)
  const [failed, setFailed] = useState(false)
  const done = resolved >= total

  useEffect(() => {
    if (done || failed) return
    const id = window.setTimeout(() => setResolved((r) => r + 1), 750)
    return () => window.clearTimeout(id)
  }, [resolved, done, failed])

  useEffect(() => {
    if (done && !failed && plan.outcome === 'clear' && !vc.journey?.checksDone)
      apply((d) => {
        const vcNow = d.cases.find((c) => c.id === vc.id)
        return {
          data: {
            ...d,
            cases: d.cases.map((c) =>
              c.id === vc.id
                ? { ...c, journey: { ...vcNow?.journey, checksDone: true } }
                : c,
            ),
          },
          audit: [
            {
              at: new Date().toISOString(),
              actor: 'Certified identity provider',
              actorType: 'system' as const,
              action: 'idvt.checks.completed',
              caseId: vc.id,
              detail: plan.differences.length
                ? `Checks complete in the browser. REG-11 to REG-13: ${plan.differences.map((x) => x.summary).join('; ')}. Flagged for the reviewer, not halted.`
                : 'Checks complete in the browser. Details agree with the register.',
            },
          ],
        }
      })
  }, [done, failed, plan, apply, vc.id, vc.journey?.checksDone])

  const max = plan.maxAttempts
  const attemptsAfter = plan.attempts
  const exhausted = attemptsAfter >= max

  const expiredDate = plan.expiry ? formatDate(plan.expiry.on) : ''
  const toOption2 = (reason: 'attempts_used' | 'unsupported_document') => {
    apply((d) => requestOption2(d, vc.id, reason))
    go('status')
  }
  const useLicence = () => {
    apply((d) => switchDocument(d, vc.id, 'driving_licence'))
    go('scan')
  }

  let panel: ReactNode = null
  if (failed || exhausted) {
    panel = exhausted ? (
      <Panel title={`You have used all ${max} attempts`}>
        <p>
          The digital checks did not pass. A trained person at {acsp} can check
          your identity instead (Option 2).
        </p>
        <Button
          className="mt-3 w-full"
          onClick={() => toOption2('attempts_used')}
        >
          <UserRoundCheck aria-hidden="true" />
          See Option 2
        </Button>
      </Panel>
    ) : (
      <Panel
        title={`That check did not pass. Attempt ${attemptsAfter} of ${max}`}
      >
        <p>
          This can happen with light or glare. You can try the selfie again.
        </p>
        <Button className="mt-3 w-full" onClick={() => go('selfie')}>
          Try again
        </Button>
      </Panel>
    )
  } else if (done && plan.outcome === 'expired') {
    panel = (
      <Panel
        title={`Your ${DOCUMENT_LABEL[vc.journey?.documentType ?? 'passport'].toLowerCase()} expired on ${expiredDate}`}
      >
        <p>
          {plan.expiry?.passport
            ? 'An expired passport cannot be accepted. Please use another document.'
            : 'This document has expired beyond the period we can accept. Please use another document.'}{' '}
          A UK photocard driving licence is accepted.
        </p>
        <div className="mt-3 space-y-2">
          <Button className="w-full" onClick={useLicence}>
            <Car aria-hidden="true" />
            Use a UK photocard driving licence
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => go('document')}
          >
            Choose another document
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => toOption2('unsupported_document')}
          >
            I have no other document
          </Button>
        </div>
      </Panel>
    )
  }

  const proceed = done && !failed && plan.outcome === 'clear'
  const flaggedNotes = plan.rows.flatMap((r) =>
    r.state === 'flagged' && r.note ? [r.note] : [],
  )
  void person

  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={!proceed}
            onClick={next}
          >
            {!done && !failed && (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            {proceed
              ? 'Continue'
              : done || failed
                ? 'Waiting for your choice'
                : 'Checking'}
            {proceed && <ChevronRight aria-hidden="true" />}
          </Button>
          {state.guided.on && !done && (
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                apply((d) => recordCheckFailure(d, vc.id, 'liveness'))
                setFailed(true)
              }}
            >
              Demo control: simulate a failed liveness check
            </Button>
          )}
        </>
      }
    >
      <ScreenTitle kicker="Checks">
        {done ? 'The checks are complete' : 'Running the checks'}
      </ScreenTitle>
      <Lead>
        Your identity verification is being conducted by {acsp} using the
        Evidence One platform. This usually takes a few seconds. You do not need
        to do anything.
      </Lead>
      <ProviderLabel className="mt-3" />
      <ul className="mt-5 space-y-3" aria-live="polite">
        {plan.rows.map((c, i) => {
          const ok = i < resolved
          const active = i === resolved && !failed
          return (
            <li
              key={c.key}
              className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5"
            >
              {ok && c.state === 'passed' ? (
                <CompletionTick className="mt-0.5 size-5" label="Passed" />
              ) : ok && c.state === 'flagged' ? (
                <Flag
                  className="mt-0.5 size-5 text-info"
                  aria-label="Flagged for review"
                />
              ) : ok ? (
                <MinusCircle
                  className="mt-0.5 size-5 text-slate"
                  aria-label="Not switched on"
                />
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
                  {ok && c.state === 'flagged' && ' (flagged for review)'}
                </span>
                <span className="block text-base text-slate">{c.by}</span>
              </span>
            </li>
          )
        })}
      </ul>
      {done &&
        flaggedNotes.map((n) => (
          <p
            key={n}
            className="mt-4 rounded-2xl bg-info-wash px-4 py-3 text-base text-ink"
          >
            {n}
          </p>
        ))}
      {panel}
    </Screen>
  )
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-4 text-base text-graphite">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      {badge && <div className="mt-2">{badge}</div>}
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function OptionTwoStep({ vc, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const acsp = reviewerOrgName(data, vc.acspId)
  const attemptsUsed =
    (vc.journey?.checkAttempts ?? 0) >=
    currentRuleSet(data).params.idvt_attempts
  const reviewer = data.acsps
    .find((a) => a.id === vc.acspId)
    ?.reviewers.find((r) => r.attestation)
  const noSmartphone = vc.option2?.reason === 'no_smartphone'
  const reason = attemptsUsed ? 'attempts_used' : 'unsupported_document'
  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) => requestOption2(d, vc.id, reason))
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
        {attemptsUsed
          ? 'The digital checks did not pass'
          : noSmartphone
            ? 'You do not have a smartphone or tablet'
            : 'Your document can’t be checked digitally'}
      </ScreenTitle>
      <Lead>
        {noSmartphone
          ? 'The digital checks need a phone or tablet camera. '
          : 'The digital checks (Option 1) cannot support your case. '}
        A trained person at {acsp} can check your identity instead. They will
        contact you to arrange it.
      </Lead>
      {noSmartphone && <PendingDecision className="mt-3" />}
      <ul className="mt-5 space-y-2.5 text-base text-graphite">
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          You will need two documents: two from Group A, or one from Group A and
          one from Group B.
        </li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          The person who checks them holds a current training attestation
          {reviewer?.attestation
            ? ` (${reviewer.attestation.reference}, valid to ${formatDate(reviewer.attestation.expiresOn)})`
            : ''}
          .
        </li>
        <li className="rounded-2xl border border-line bg-white px-4 py-3">
          The decision is still made by {acsp}, and recorded in your case like
          any other.
        </li>
      </ul>
    </Screen>
  )
}
