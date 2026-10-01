import { Navigate, useNavigate, useParams } from 'react-router'
import { PhoneFrame } from '@/components/phone/PhoneFrame'
import { useDemoStore } from '@/store/DemoStore'
import { getCase, getCompany, getPerson } from '@/store/selectors'
import { nextStep, pathFor, prevStep, stepById, type StepId } from './journey'
import { AppBar, Lead, Screen, ScreenTitle, JourneyShell } from './JourneyShell'
import {
  EvidenceStep,
  PaymentStep,
  ReviewStep,
  StatusStep,
} from './steps/FinishSteps'
import {
  ChecksStep,
  ChipStep,
  DocumentStep,
  OptionTwoStep,
  ScanStep,
  SelfieStep,
} from './steps/IdentitySteps'
import {
  ContactStep,
  DetailsStep,
  InviteStep,
  PersonalStep,
} from './steps/IntroSteps'
import type { StepProps } from './steps/types'

const screens: Record<StepId, (p: StepProps) => React.ReactNode> = {
  invite: InviteStep,
  contact: ContactStep,
  details: DetailsStep,
  personal: PersonalStep,
  document: DocumentStep,
  scan: ScanStep,
  chip: ChipStep,
  selfie: SelfieStep,
  checks: ChecksStep,
  evidence: EvidenceStep,
  payment: PaymentStep,
  review: ReviewStep,
  status: StatusStep,
  'option-2': OptionTwoStep,
}

const OPEN = ['invited', 'in_progress']

/** The individual's journey in the Evidence One app, one screen per step. */
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
      <div className="mx-auto max-w-[88rem] sm:px-6 sm:py-10">
        <PhoneFrame>
          <AppBar stage={0} hideProgress />
          <Screen>
            <ScreenTitle>This invite link is not valid</ScreenTitle>
            <Lead>Please ask the Agent who invited you for a new link.</Lead>
          </Screen>
        </PhoneFrame>
      </div>
    )
  }

  // Once submitted, or paused for a human check, the app only shows the status tracker.
  const locked = !OPEN.includes(vc.status) || vc.option === 2
  if (locked && step !== 'status')
    return <Navigate to={`/app/${caseId}/status`} replace />
  if (!locked && step !== 'option-2' && !pathFor(data, vc).includes(spec.id))
    return <Navigate to={`/app/${caseId}/${pathFor(data, vc)[0]}`} replace />

  const go = (id: StepId) => navigate(`/app/${caseId}/${id}`)
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
      <Step
        key={step}
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
