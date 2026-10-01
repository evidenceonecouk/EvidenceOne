import { addressHistoryNeedsEvidence } from '@/lib/register'
import type { DemoData, VerificationCase } from '@/types/domain'

export type StepId =
  | 'invite'
  | 'details'
  | 'address'
  | 'document'
  | 'scan'
  | 'chip'
  | 'selfie'
  | 'checks'
  | 'evidence'
  | 'payment'
  | 'review'
  | 'status'
  | 'option-2'

export interface StepSpec {
  id: StepId
  /** Which of the four progress segments the step belongs to. */
  stage: 0 | 1 | 2 | 3
  caption: { kicker: string; title: string; body: string }
}

/* Presenter captions shown beside the phone on wide screens. */
export const steps: StepSpec[] = [
  { id: 'invite', stage: 0, caption: { kicker: 'Invite', title: 'An invite, pre-filled from the register', body: 'The Agent sent this from the portal. It already knows the company and the role, and the fee is covered by an Agent Payment Code.' } },
  { id: 'details', stage: 0, caption: { kicker: 'Step 1 · Collect information', title: 'Confirm, or ask for an amendment', body: 'Details come from the Companies House register. Anything wrong goes back to the Agent as an amendment request, logged in the audit trail.' } },
  { id: 'address', stage: 0, caption: { kicker: 'Step 1 · Collect information', title: 'Twelve months of address history', body: 'Collected as information, not as a document. Proof of address is only asked for later if the evidence needs it.' } },
  { id: 'document', stage: 1, caption: { kicker: 'Step 2 · One identity document', title: 'Verify with just one document', body: 'Option 1 uses a certified identity provider. A trained human check (Option 2) is offered only if the document cannot be checked digitally.' } },
  { id: 'scan', stage: 1, caption: { kicker: 'Step 3 · Is the document real?', title: 'Photo page scan', body: 'The camera reads the machine-readable zone, which unlocks the chip. The document is captured once and reused for every check.' } },
  { id: 'chip', stage: 1, caption: { kicker: 'Step 3 · Is the document real?', title: 'Passport chip read', body: 'Only possible in an app: no browser can reach a passport chip. The chip’s digital signature proves who issued the document.' } },
  { id: 'selfie', stage: 1, caption: { kicker: 'Step 4 · Does it belong to them?', title: 'Liveness and face match', body: 'A short selfie video proves a live person is present and matches them to the photo stored on the chip.' } },
  { id: 'checks', stage: 1, caption: { kicker: 'Steps 3 and 4 · Automated checks', title: 'Checks run while they wait', body: 'Authenticity, liveness, face match and PEP and sanctions screening by the provider, then an AI comparison with the register. AI flags. It never decides.' } },
  { id: 'evidence', stage: 2, caption: { kicker: 'Supporting evidence, only if needed', title: 'The AI asked for one more document', body: 'This person moved within the last 12 months, so the identity document cannot confirm the address history. Evidence must be dated within 3 months.' } },
  { id: 'payment', stage: 2, caption: { kicker: 'Payment', title: 'A flat £49, or nothing to pay', body: 'Pay by card, or use an Agent Payment Code from an Agent, family office, introducer or corporate service provider.' } },
  { id: 'review', stage: 2, caption: { kicker: 'Submit', title: 'Check, declare and submit', body: 'Submitting sends the case to the ACSP’s review queue and starts a 36-hour SLA.' } },
  { id: 'status', stage: 3, caption: { kicker: 'Step 5 · A person decides', title: 'A clear tracker until the personal code', body: 'The ACSP reviews the evidence and decides. After approval they submit to Companies House through GOV.UK One Login, and the personal code appears here.' } },
  { id: 'option-2', stage: 1, caption: { kicker: 'Option 2 · Fallback only', title: 'A trained human check', body: 'Offered only when Option 1 cannot support the person’s document. The ACSP arranges the check and records it in the case.' } },
]

export const stageLabels = ['Details', 'Identity', 'Submit', 'Decision']

export const stepById = (id: string) => steps.find((s) => s.id === id)

/** The ordered path for this case, skipping steps that do not apply. */
export function pathFor(data: DemoData, vc: VerificationCase): StepId[] {
  const person = data.people.find((p) => p.id === vc.personId)
  const needsEvidence = person ? addressHistoryNeedsEvidence(person) : false
  const isPassport = (vc.journey?.documentType ?? 'passport') === 'passport'
  const path: StepId[] = ['invite', 'details', 'address', 'document', 'scan']
  if (isPassport) path.push('chip')
  path.push('selfie', 'checks')
  if (needsEvidence) path.push('evidence')
  path.push('payment', 'review', 'status')
  return vc.origin === 'b2c' ? path.filter((s) => s !== 'invite') : path
}

export function nextStep(data: DemoData, vc: VerificationCase, current: StepId): StepId {
  const path = pathFor(data, vc)
  const i = path.indexOf(current)
  return path[Math.min(path.length - 1, i + 1)]
}

export function prevStep(data: DemoData, vc: VerificationCase, current: StepId): StepId | undefined {
  const path = pathFor(data, vc)
  const i = path.indexOf(current)
  return i > 0 ? path[i - 1] : undefined
}
