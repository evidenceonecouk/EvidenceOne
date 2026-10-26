import { hasChipStep } from '@/lib/chip'
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
  /** The identity provider's chip reader, inside the provider journey, where the document has a chip. */
  | 'chip'
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
      body: 'The ACSP is the service provider and Evidence One is its technology provider. The ACSP takes the payment, only on approval, and makes the verification statement.',
    },
  },
  {
    id: 'payment',
    stage: 1,
    caption: {
      kicker: 'Authorise payment to the ACSP',
      title: 'Authorised now, taken only on approval',
      body: "The card is authorised when the client instructs the ACSP. The ACSP's own fee is taken only when it approves, and the invoice is issued in its name then. Nothing is taken on a decline. A Referral Partner may pay with a single-use Agent Payment Code, on the same terms.",
    },
  },
  {
    id: 'document',
    stage: 2,
    caption: {
      kicker: 'Step 2 · One identity document',
      title: 'Verify with just one document',
      body: 'Passports, licences, identity cards, residence permits and eVisas all go through the certified identity provider. Expired passports are not accepted. Option 2 is a fallback only.',
    },
  },
  {
    id: 'scan',
    stage: 2,
    caption: {
      kicker: 'Step 3 · Is the document real?',
      title: 'Document capture, on a phone or tablet',
      body: 'The provider needs a phone or tablet camera. On a computer the person scans a QR code or asks for a link, finishes on the phone, and the computer shows the result. On a phone it is direct. There is no webcam-only route.',
    },
  },
  {
    id: 'chip',
    stage: 2,
    caption: {
      kicker: 'Step 3 · Passport chip',
      title: "The identity provider's chip reader",
      body: "A biometric passport's chip is read by the identity provider's own chip reader on the person's phone, inside the same journey. It is not an Evidence One app. If the chip is not read, the case continues and the reviewer decides.",
    },
  },
  {
    id: 'selfie',
    stage: 2,
    caption: {
      kicker: 'Step 4 · Does it belong to them?',
      title: 'Liveness and face match',
      body: 'Recorded on the phone or tablet, or directly on a phone. A phone camera gives a clearer result.',
    },
  },
  {
    id: 'checks',
    stage: 2,
    caption: {
      kicker: 'Steps 3 and 4 · Automated checks',
      title: 'Checks run while they wait',
      body: 'Document authenticity and security features, the chip where it was read, liveness, face match and, where the ACSP switched them on, PEP and sanctions screening and the electronic address check. The rules then compare details with the register, the same way every time.',
    },
  },
  {
    id: 'address',
    stage: 2,
    caption: {
      kicker: 'Proof of address',
      title: 'One proof of current address',
      body: 'Please provide a document confirming your current residential address, dated within the last 6 months. Asked from every individual.',
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
      body: "Offered only when Option 1 cannot support the person's document, or the person has no smartphone or tablet (pending the client's decision). Two documents are needed, and the reviewer must hold a current training attestation.",
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

/** B2C clients see suggested ACSPs. A Referral Partner referral already names the ACSP the Partner selected. */
export function needsSuggestion(data: DemoData, vc: VerificationCase) {
  void data
  return vc.origin === 'b2c'
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
  // The chip step sits after the document capture; its exact place is to be confirmed with the provider.
  const person = data.people.find((p) => p.id === vc.personId)
  if (
    hasChipStep(
      person?.document,
      vc.journey?.documentType ?? person?.document?.type,
    )
  )
    path.splice(path.indexOf('scan') + 1, 0, 'chip')
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
