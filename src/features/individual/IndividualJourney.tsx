import { Navigate, useNavigate, useParams } from 'react-router'
import { useDemoStore } from '@/store/DemoStore'
import { getCase, getCompany, getPerson } from '@/store/selectors'
import { nextStep, pathFor, prevStep, stepById, type StepId } from './journey'
import { AppBar, Lead, Screen, ScreenTitle, JourneyShell } from './JourneyShell'
import { useJourneyView } from './JourneyView'
import {
  AddressStep,
  EvidenceStep,
  ReviewStep,
  StatusStep,
} from './steps/FinishSteps'
import {
  ChecksStep,
  DocumentStep,
  OptionTwoStep,
  ScanStep,
  SelfieStep,
} from './steps/IdentitySteps'
import {
  ContactStep,
  DetailsStep,
  InstructStep,
  InviteStep,
  PaymentStep,
  PersonalStep,
  SuggestStep,
} from './steps/IntroSteps'
import type { StepProps } from './steps/types'

const screens: Record<StepId, (p: StepProps) => React.ReactNode> = {
  invite: InviteStep,
  contact: ContactStep,
  details: DetailsStep,
  personal: PersonalStep,
  suggest: SuggestStep,
  instruct: InstructStep,
  payment: PaymentStep,
  document: DocumentStep,
  scan: ScanStep,
  selfie: SelfieStep,
  checks: ChecksStep,
  address: AddressStep,
  evidence: EvidenceStep,
  review: ReviewStep,
  status: StatusStep,
  'option-2': OptionTwoStep,
}

const OPEN = ['invited', 'in_progress']

/** Renders the step inside the shell, so it can pass the mobile or desktop view to the step. */
function StepHost({
  Step,
  ...props
}: StepProps & { Step: (p: StepProps) => React.ReactNode }) {
  const { mode } = useJourneyView()
  return <Step {...props} viewMode={mode} />
}

/** The individual's journey in the browser, one screen per step, on a phone or a laptop. */
export function IndividualJourney() {
  const { caseId = '', step = 'invite' } = useParams()
  const navigate = useNavigate()
  const { data } = useDemoStore()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry =
    vc &&
    data.register.find(
      (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
    )
  const spec = stepById(step)

  if (!vc || !person || !company || !entry || !spec) {
    return (
      <JourneyShell caseId={caseId}>
        <AppBar stage={0} hideProgress />
        <Screen>
          <ScreenTitle>This invite link is not valid</ScreenTitle>
          <Lead>
            Please ask the person who invited you for a new link, or start again
            at verify.evidenceone.co.uk.
          </Lead>
        </Screen>
      </JourneyShell>
    )
  }

  // Once submitted, or paused for a human check, the journey only shows the status tracker.
  const locked = !OPEN.includes(vc.status) || vc.option === 2
  if (locked && step !== 'status')
    return <Navigate to={`/journey/${caseId}/status`} replace />
  if (!locked && step !== 'option-2' && !pathFor(data, vc).includes(spec.id))
    return (
      <Navigate to={`/journey/${caseId}/${pathFor(data, vc)[0]}`} replace />
    )

  const go = (id: StepId) => navigate(`/journey/${caseId}/${id}`)
  const back = step === 'option-2' ? 'document' : prevStep(data, vc, spec.id)
  const Step = screens[spec.id]

  return (
    <JourneyShell step={spec} caseId={caseId}>
      <AppBar
        stage={spec.stage}
        onBack={
          !locked && back && step !== 'invite' ? () => go(back) : undefined
        }
        hideProgress={step === 'invite'}
      />
      <StepHost
        key={step}
        Step={Step}
        vc={vc}
        person={person}
        company={company}
        entry={entry}
        go={go}
        next={() => go(nextStep(data, vc, spec.id))}
      />
    </JourneyShell>
  )
}
