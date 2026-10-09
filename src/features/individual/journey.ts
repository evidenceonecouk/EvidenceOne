import { currentRuleSet, evidenceTriggers } from '@/lib/rules'
import type { DemoData, VerificationCase } from '@/types/domain'

export type StepId =
  | 'invite'
  | 'contact'
  | 'details'
  | 'personal'
  /** B2C only: suggested ACSPs, ranked by clear criteria (not AI). */
  | 'suggest'
  /** Who will verify you: the named ACSP, its fee and turnaround. */
  | 'instruct'
  | 'payment'
  | 'document'
  | 'scan'
  | 'selfie'
  | 'checks'
  /** Proof of current address from every individual (ADDL-02). */
  | 'address'
  /** One supporting document, only on ADDL-01 or ADDL-03. */
  | 'evidence'
  | 'review'
  | 'status'
  | 'option-2'

export interface StepSpec {
  id: StepId
  /** Which of the five progress segments the step belongs to. */
  stage: 0 | 1 | 2 | 3 | 4
  caption: { kicker: string; title: string; body: string }
}

/* Presenter captions shown beside the browser on wide screens. */
export const steps: StepSpec[] = [
  {
    id: 'invite',
    stage: 0,
    caption: {
      kicker: 'Invite',
      title: 'An invite, pre-filled from the register',
      body: 'It opens in the browser, on a laptop or a phone. It already knows the company and the role, and shows who invited you and which ACSP will verify you. If the register already shows you as verified, you are told first.',
    },
  },
  {
    id: 'contact',
    stage: 0,
    caption: {
      kicker: 'Registration',
      title: 'Email and mobile confirmed first',
      body: 'A one-time code by email and a code by SMS, before anything else. Afterwards you sign in with a one-time code or a passkey.',
    },
  },
  {
    id: 'details',
    stage: 0,
    caption: {
      kicker: 'Register details',
      title: 'Confirm, or ask for an amendment',
      body: 'Details come from the Companies House register and are compared with it. A difference never stops you: your ACSP sees it and decides.',
    },
  },
  {
    id: 'personal',
    stage: 0,
    caption: {
      kicker: 'Step 1 · Personal information',
      title: 'Name, former names, date of birth and address history',
      body: 'Former names must be answered, even if the answer is none. Proof of your current address is asked for later, once, from everyone.',
    },
  },
  {
    id: 'suggest',
    stage: 0,
    caption: {
      kicker: 'Suggested ACSPs',
      title: 'Ranked by clear criteria. Not AI.',
      body: 'Each suggestion shows its own fee, turnaround and why it matches. You may ask for a different ACSP once, before instructing. An administrator confirms the allocation at launch.',
    },
  },
  {
    id: 'instruct',
    stage: 1,
    caption: {
      kicker: 'Who will verify you',
      title: 'Instruct the named ACSP',
      body: 'The ACSP is the service provider and Evidence One is its technology provider. The ACSP takes the payment and makes the verification statement.',
    },
  },
  {
    id: 'payment',
    stage: 1,
    caption: {
      kicker: 'Payment to the ACSP',
      title: "The ACSP's own fee, collected as its agent",
      body: "Evidence One collects the payment on the ACSP's behalf. The invoice is issued in the ACSP's name. A Referral Partner may pay with a single-use Agent Payment Code.",
    },
  },
  {
    id: 'document',
    stage: 2,
    caption: {
      kicker: 'Step 2 · One identity document',
      title: 'Verify with just one document',
      body: 'Passports, licences, identity cards and residence permits all go through the browser. Upload from this computer, continue on your phone, or use the camera directly on a phone. Option 2 is a fallback only.',
    },
  },
  {
    id: 'scan',
    stage: 2,
    caption: {
      kicker: 'Step 3 · Is the document real?',
      title: 'Document capture',
      body: 'The document goes straight to the certified identity provider, once. It is never uploaded twice.',
    },
  },
  {
    id: 'selfie',
    stage: 2,
    caption: {
      kicker: 'Step 4 · Does it belong to them?',
      title: 'Liveness and face match',
      body: "A phone camera usually gives a clearer result, and this computer's camera is a supported choice.",
    },
  },
  {
    id: 'checks',
    stage: 2,
    caption: {
      kicker: 'Steps 3 and 4 · Automated checks',
      title: 'Checks run while they wait',
      body: 'Document authenticity, liveness, face match and, where the ACSP uses it, PEP and sanctions screening. The rules then compare details with the register, the same way every time.',
    },
  },
  {
    id: 'address',
    stage: 2,
    caption: {
      kicker: 'Proof of address',
      title: 'One proof of current address',
      body: 'Asked from every individual, dated within the last six months. The exact wording is Pending your decision (P3).',
    },
  },
  {
    id: 'evidence',
    stage: 2,
    caption: {
      kicker: 'Supporting evidence, only on a trigger',
      title: 'We need one supporting document',
      body: 'Asked for only when the document has expired beyond its exception or a former name is declared, and never as a second identity document.',
    },
  },
  {
    id: 'review',
    stage: 3,
    caption: {
      kicker: 'Submit',
      title: 'Check, declare and submit',
      body: "Submitting sends the case to the ACSP's review queue.",
    },
  },
  {
    id: 'status',
    stage: 4,
    caption: {
      kicker: 'Step 5 · A person decides',
      title: 'A clear tracker, start to finish',
      body: 'The ACSP reviews and decides, then submits to Companies House. Companies House emails the personal code directly to the person. Evidence One does not receive or keep it.',
    },
  },
  {
    id: 'option-2',
    stage: 2,
    caption: {
      kicker: 'Option 2 · Fallback only',
      title: 'A trained person check',
      body: "Offered only when Option 1 cannot support the person's document. Two documents are needed, and the reviewer must hold a current training attestation.",
    },
  },
]

export const stageLabels = [
  'Details',
  'Payment',
  'Identity',
  'Submit',
  'Decision',
]

export const stepById = (id: string) => steps.find((s) => s.id === id)

/** Whether a rule (ADDL-01 to ADDL-03) asks this person for one supporting document. */
export function journeyTriggers(data: DemoData, vc: VerificationCase) {
  const person = data.people.find((p) => p.id === vc.personId)
  if (!person) return []
  const type = vc.journey?.documentType ?? 'passport'
  const doc =
    person.document?.type === type
      ? person.document
      : type === 'driving_licence'
        ? undefined
        : { type }
  return evidenceTriggers(
    person,
    doc,
    currentRuleSet(data),
    vc.journey?.formerNames,
  )
}

/** B2C clients, and invites where the Referral Partner let the platform suggest, see suggested ACSPs. */
export function needsSuggestion(data: DemoData, vc: VerificationCase) {
  return (
    vc.origin === 'b2c' ||
    data.invites.some(
      (i) => i.caseId === vc.id && i.instructingAcspId === 'platform_suggest',
    )
  )
}

/** The ordered path for this case, skipping steps that do not apply. */
export function pathFor(data: DemoData, vc: VerificationCase): StepId[] {
  const path: StepId[] = ['invite', 'contact', 'details', 'personal']
  if (needsSuggestion(data, vc)) path.push('suggest')
  path.push(
    'instruct',
    'payment',
    'document',
    'scan',
    'selfie',
    'checks',
    'address',
  )
  if (journeyTriggers(data, vc).length) path.push('evidence')
  path.push('review', 'status')
  return vc.origin === 'b2c' ? path.filter((s) => s !== 'invite') : path
}

export function nextStep(
  data: DemoData,
  vc: VerificationCase,
  current: StepId,
): StepId {
  const path = pathFor(data, vc)
  const i = path.indexOf(current)
  return path[Math.min(path.length - 1, i + 1)]
}

export function prevStep(
  data: DemoData,
  vc: VerificationCase,
  current: StepId,
): StepId | undefined {
  const path = pathFor(data, vc)
  const i = path.indexOf(current)
  return i > 0 ? path[i - 1] : undefined
}
