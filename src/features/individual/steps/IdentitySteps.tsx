import {
  BookUser,
  Car,
  ChevronRight,
  CreditCard,
  Flag,
  IdCard,
  Loader2,
  MinusCircle,
  Monitor,
  Smartphone,
  Upload,
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
import {
  DOCUMENT_LABEL,
  GROUP_B_DOCUMENTS,
  planChecks,
} from '@/lib/identityChecks'
import { formatDate } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { requestOption2 } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  chooseDocument,
  continueWithSupportingDocument,
  recordCheckFailure,
  recordDocumentCapture,
  recordLivenessCapture,
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
    note: 'From any country. Checked in your browser.',
    icon: BookUser,
  },
  {
    type: 'driving_licence',
    label: 'Photocard driving licence',
    note: 'UK. Checked in your browser, on a computer or a phone.',
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
  const [second, setSecond] = useState<string>(
    vc.journey?.eVisaSecondDocument ?? GROUP_B_DOCUMENTS[0],
  )
  const chosen = eVisa ? 'passport' : type

  return (
    <Screen
      footer={
        <>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) =>
                chooseDocument(
                  d,
                  vc.id,
                  chosen,
                  eVisa,
                  eVisa ? second : undefined,
                ),
              )
              next()
            }}
          >
            Continue with {DOCUMENT_LABEL[chosen].toLowerCase()}
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
            <span className="block text-base font-medium text-ink">
              I hold an eVisa
            </span>
            <span className="block text-base leading-snug text-slate">
              Your passport plus one other document
            </span>
          </span>
          <RadioMark on={eVisa} />
        </label>
      </fieldset>
      {eVisa && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <p className="text-base text-graphite">
            For now we ask for your passport plus any one document from Group B.
            We will change this when the certified identity provider can check
            an eVisa in the browser.
          </p>
          <fieldset className="mt-3 space-y-2">
            <legend className="text-base font-medium text-ink">
              Your second document
            </legend>
            {GROUP_B_DOCUMENTS.map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink"
              >
                <input
                  type="radio"
                  name="groupb"
                  className="sr-only"
                  checked={second === g}
                  onChange={() => setSecond(g)}
                />
                <RadioMark on={second === g} />
                <span className="text-base text-ink">{g}</span>
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </Screen>
  )
}

function ChoiceCard({
  icon: Icon,
  title,
  note,
  badge,
  onClick,
}: {
  icon: typeof Upload
  title: string
  note: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left hover:border-ink focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-base font-medium text-ink">
          {title}
          {badge && (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[0.875rem] font-medium text-graphite">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-base leading-snug text-slate">
          {note}
        </span>
      </span>
      <ChevronRight
        className="mt-2 size-5 shrink-0 text-slate"
        aria-hidden="true"
      />
    </button>
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

export function ScanStep({ vc, person, next, viewMode }: StepProps) {
  const { apply } = useDemoStore()
  const mode = useViewMode(viewMode)
  const mobile = mode === 'mobile'
  const already = !!vc.journey?.photoPageDone
  const type = vc.journey?.documentType ?? 'passport'
  const isPassport = type === 'passport'
  const [route, setRoute] = useState<'upload' | 'phone' | 'camera' | undefined>(
    vc.journey?.captureRoute ?? (mobile ? 'camera' : undefined),
  )
  const activeRoute = mobile && route !== 'phone' ? 'camera' : route
  const [running, setRunning] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const progress = useProgress(scanDuration(isPassport), running)
  const done = already || progress >= 100
  const phase = scanPhase(progress, isPassport, running, done)
  const facts = useMemo(() => documentFacts(person, type), [person, type])

  useEffect(() => {
    if (!done || already || !activeRoute || activeRoute === 'phone') return
    apply((d) => recordDocumentCapture(d, vc.id, type, activeRoute))
  }, [done, already, apply, vc.id, type, activeRoute])

  useEffect(() => {
    if (!receiving) return
    const id = window.setTimeout(() => {
      apply((d) => recordDocumentCapture(d, vc.id, type, 'phone'))
      setReceiving(false)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [receiving, apply, vc.id, type])

  const upload = activeRoute === 'upload'
  const status: Record<typeof phase, string> = {
    idle: upload
      ? 'Choose a clear photo or scan of the page. Good light, no glare, all four corners visible.'
      : 'Good light, no glare, all four corners visible.',
    align: isPassport
      ? 'Hold the page flat inside the frame'
      : 'Hold the card flat inside the frame',
    page: upload
      ? 'Uploading and reading the photo page'
      : 'Reading the photo page',
    mrz: 'Reading the machine-readable zone',
    front: 'Reading the front',
    turn: 'Now turn it over',
    back:
      type === 'driving_licence'
        ? 'Reading the back'
        : 'Reading the machine-readable zone',
    capture: 'Hold steady',
    done:
      activeRoute === 'phone'
        ? 'Received from your phone’s browser. You are back in your case, and you will not add it again.'
        : 'Added. We reuse this for every check, so you will not add it again.',
  }

  const title = isPassport
    ? 'Place the photo page in the frame'
    : 'Place your document in the frame'

  let body: ReactNode
  let footer: ReactNode
  if (done) {
    footer = <ContinueButton onClick={next} />
    body = (
      <>
        <ScreenTitle kicker="Identity document">Document added</ScreenTitle>
        <ProviderLabel className="mt-3" />
        <DocumentScan
          facts={facts}
          look={portraitFor(person)}
          progress={100}
          phase="done"
        />
        <p className="mt-4 text-base text-graphite" role="status">
          {status.done}
        </p>
      </>
    )
  } else if (!activeRoute) {
    footer = undefined
    body = (
      <>
        <ScreenTitle kicker="Identity document">
          How would you like to add your document?
        </ScreenTitle>
        <ProviderLabel className="mt-3" />
        <div className="mt-5 space-y-2.5">
          <ChoiceCard
            icon={Upload}
            title="Upload your document"
            note="Choose a photo or scan from this computer."
            onClick={() => setRoute('upload')}
          />
          <ChoiceCard
            icon={Smartphone}
            title="Continue on your phone"
            note="Scan a code or get a link. You add the document in your phone’s browser and come back to this case."
            onClick={() => setRoute('phone')}
          />
        </div>
      </>
    )
  } else if (activeRoute === 'phone') {
    footer = undefined
    body = (
      <>
        <ScreenTitle kicker="Identity document">
          Continue on your phone
        </ScreenTitle>
        <ProviderLabel className="mt-3" />
        <PhoneHandoff
          purpose="document"
          caseId={vc.id}
          mobile={person.mobile}
          receiving={receiving}
          onReturn={() => setReceiving(true)}
          onChoose={() => setRoute(mobile ? 'camera' : undefined)}
        />
      </>
    )
  } else {
    footer = (
      <>
        <Button
          className="w-full disabled:opacity-100"
          size="lg"
          disabled={running}
          onClick={() => setRunning(true)}
        >
          {running ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : upload ? (
            <Upload aria-hidden="true" />
          ) : null}
          {running
            ? 'Hold steady'
            : upload
              ? 'Choose a file from this computer'
              : isPassport
                ? 'Scan the photo page'
                : 'Scan my document'}
        </Button>
        {!mobile && !running && (
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => setRoute(undefined)}
          >
            Choose another way
          </Button>
        )}
      </>
    )
    body = (
      <>
        <ScreenTitle kicker="Identity document">{title}</ScreenTitle>
        <ProviderLabel className="mt-3" />
        <DocumentScan
          facts={facts}
          look={portraitFor(person)}
          progress={progress}
          phase={phase}
        />
        <p className="mt-4 text-base text-graphite" role="status">
          {status[phase]}
        </p>
        {upload && (
          <p className="mt-2 text-[0.875rem] text-slate">
            Demo: the specimen document is used. No file is read or sent.
          </p>
        )}
      </>
    )
  }

  return <Screen footer={footer}>{body}</Screen>
}

export function SelfieStep({ vc, person, next, viewMode }: StepProps) {
  const { apply } = useDemoStore()
  const mode = useViewMode(viewMode)
  const mobile = mode === 'mobile'
  const already = !!vc.journey?.selfieDone
  const [route, setRoute] = useState<'phone' | 'computer' | undefined>(
    vc.journey?.livenessRoute ?? (mobile ? 'computer' : undefined),
  )
  const [running, setRunning] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const attempts = vc.journey?.checkAttempts ?? 0
  const index = useSequence(livenessDurations, running)
  const done = already || index >= livenessBeats.length
  const beat = livenessBeat(index, done)
  const recording = beat?.ring === 'rec'

  useEffect(() => {
    if (!done || already || !route || route === 'phone') return
    apply((d) => recordLivenessCapture(d, vc.id, mobile ? 'phone' : 'computer'))
  }, [done, already, apply, vc.id, route, mobile])

  useEffect(() => {
    if (!receiving) return
    const id = window.setTimeout(() => {
      apply((d) => recordLivenessCapture(d, vc.id, 'phone'))
      setReceiving(false)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [receiving, apply, vc.id])

  const kicker = attempts
    ? `Selfie video, attempt ${attempts + 1} of 3`
    : 'Selfie video'

  if (!done && !route)
    return (
      <Screen>
        <ScreenTitle kicker={kicker}>Show us it is really you</ScreenTitle>
        <ProviderLabel className="mt-3" />
        <div className="mt-5 space-y-2.5">
          <ChoiceCard
            icon={Smartphone}
            title="Continue on your phone"
            badge="Recommended"
            note="A phone camera usually gives a clearer result."
            onClick={() => setRoute('phone')}
          />
          <ChoiceCard
            icon={Monitor}
            title="Use this computer’s camera"
            note="A supported choice if you do not have a smartphone."
            onClick={() => setRoute('computer')}
          />
        </div>
      </Screen>
    )

  if (!done && route === 'phone' && !mobile)
    return (
      <Screen>
        <ScreenTitle kicker={kicker}>Continue on your phone</ScreenTitle>
        <ProviderLabel className="mt-3" />
        <PhoneHandoff
          purpose="liveness"
          caseId={vc.id}
          mobile={person.mobile}
          receiving={receiving}
          onReturn={() => setReceiving(true)}
          onChoose={() => setRoute(undefined)}
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
      {done && already && route === 'phone' && !mobile ? (
        <p className="mt-5 text-base text-graphite" role="status">
          Received from your phone’s browser. You are back in your case.
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
  const useLicence = (why: 'expired' | 'other_document') => {
    apply((d) => switchDocument(d, vc.id, 'driving_licence', why))
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
        badge={
          plan.expiry?.passport ? <PendingDecision code="H1" /> : undefined
        }
      >
        <p>
          For now we ask for another document. A UK photocard driving licence is
          checked in your browser. You can also continue with this one and send
          one supporting document, and the reviewer decides.
        </p>
        <div className="mt-3 space-y-2">
          <Button className="w-full" onClick={() => useLicence('expired')}>
            <Car aria-hidden="true" />
            Use a UK photocard driving licence
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              apply((d) => continueWithSupportingDocument(d, vc.id))
              setResolved(total)
            }}
          >
            Continue and send one supporting document
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
  } else if (done && plan.outcome === 'other_document') {
    panel = (
      <Panel title="We need a different document">
        <p>
          This document cannot be used on its own at the moment. A UK photocard
          driving licence is checked in your browser. If you do not have one, a
          trained person can check your identity instead.
        </p>
        <div className="mt-3 space-y-2">
          <Button
            className="w-full"
            onClick={() => useLicence('other_document')}
          >
            <Car aria-hidden="true" />
            Use a UK photocard driving licence
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => toOption2('unsupported_document')}
          >
            I do not have one
          </Button>
        </div>
      </Panel>
    )
  }

  const proceed = done && !failed && plan.outcome === 'clear'
  const flaggedNote = plan.rows.find((r) => r.state === 'flagged')?.note
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
      {done && flaggedNote && (
        <p className="mt-4 rounded-2xl bg-info-wash px-4 py-3 text-base text-ink">
          {flaggedNote}
        </p>
      )}
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
          : 'Your document can’t be checked digitally'}
      </ScreenTitle>
      <Lead>
        The digital checks (Option 1) cannot support your case. A trained person
        at {acsp} can check your identity instead. They will contact you to
        arrange it.
      </Lead>
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
