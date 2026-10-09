import type { PersonaId } from '@/types/domain'

export interface GuidedStep {
  id: string
  /** Short heading shown on the caption card. */
  title: string
  persona: PersonaId
  route: string
  /** One or two sentences. Plain, calm, no hype. */
  caption: string
  /** Shows the idle timeout notice for demonstration only. */
  idle?: 'professional' | 'individual'
}

const J = '/journey/EO-2026-000135'

export const guidedSteps: GuidedStep[] = [
  {
    id: 'landing',
    title: 'Alongside GOV.UK',
    persona: 'b2c',
    route: '/',
    caption:
      'Evidence One sits alongside the free GOV.UK ID Check app. A person chooses a named ACSP and verifies in their browser, with help in six languages.',
  },
  {
    id: 'join-partner',
    title: 'A Referral Partner joins',
    persona: 'partner',
    route: '/join/partner',
    caption:
      'Multi-step onboarding with mobile numbers confirmed by code. The partner is clearly not the verifying ACSP, and the commission question is a switch with a regulator.',
  },
  {
    id: 'join-acsp',
    title: 'An ACSP joins',
    persona: 'reviewer',
    route: '/join/acsp',
    caption:
      'The ACSP gives its regulatory status, the cases it accepts, its fee and its payment account. The application ends in Pending platform approval.',
  },
  {
    id: 'approvals',
    title: 'Platform Administrator approves',
    persona: 'platformAdmin',
    route: '/admin/approvals',
    caption:
      'The Platform Administrator approves ACSPs and Referral Partners. This role manages allocation and monitoring, and cannot read identity evidence.',
  },
  {
    id: 'portfolio',
    title: 'Referral Partner portfolio',
    persona: 'partner',
    route: '/partner',
    caption:
      'Companies, directors and PSCs with status and check results: Invited, In progress, Further information required, Completed or Declined. Never documents or messages.',
  },
  {
    id: 'lookup',
    title: 'Company lookup',
    persona: 'partner',
    route: '/partner/lookup',
    caption:
      'Live search of the public register through a proxy, with mock data as a fallback. Connect a company to see its officers and PSCs.',
  },
  {
    id: 'bulk-invite',
    title: 'Bulk invite',
    persona: 'partner',
    route: '/partner/companies/99520316/invite',
    caption:
      'Invites are pre-filled from the register. Choose the instructing ACSP or let the platform suggest one, and choose who pays: the client, or the partner with a single-use Agent Payment Code.',
  },
  {
    id: 'invite',
    title: 'The individual opens the invite',
    persona: 'individual',
    route: `${J}/invite`,
    caption:
      'The journey runs in the browser, in a phone frame or on a desktop. There is nothing to install, and the language switch is always visible.',
  },
  {
    id: 'contact',
    title: 'Confirm email and mobile',
    persona: 'individual',
    route: `${J}/contact`,
    caption:
      'A one-time code to the email address and an SMS code to the mobile number. SMS is used here, and never for professional step-up.',
  },
  {
    id: 'details',
    title: 'Confirm register details',
    persona: 'individual',
    route: `${J}/details`,
    caption:
      'Details held on the register are shown for the person to confirm or amend. A difference does not stop the journey: it is flagged to the reviewer later.',
  },
  {
    id: 'personal',
    title: 'Personal information',
    persona: 'individual',
    route: `${J}/personal`,
    caption:
      'Step 1 collects personal information, including a 12-month address history. Languages: Russian, Arabic, Spanish, French, Italian and Chinese (Simplified).',
  },
  {
    id: 'instruct',
    title: 'Instruct the named ACSP',
    persona: 'individual',
    route: `${J}/instruct`,
    caption:
      'The person sees who will verify them, the fee and the turnaround, and that Evidence One is the ACSP’s technology provider.',
  },
  {
    id: 'payment',
    title: 'Pay the ACSP',
    persona: 'individual',
    route: `${J}/payment`,
    caption:
      'The person pays the ACSP. Evidence One collects the payment as the ACSP’s agent, and the invoice is issued in the ACSP’s name.',
  },
  {
    id: 'document',
    title: 'One identity document, in the browser',
    persona: 'individual',
    route: `${J}/document`,
    caption:
      'Browser route with no chip reading, on desktop and mobile. Upload from the computer, or continue on the phone to capture in its browser and return to the same case.',
  },
  {
    id: 'selfie',
    title: 'Liveness and face match',
    persona: 'individual',
    route: `${J}/selfie`,
    caption:
      'On a desktop, continuing on the phone is preferred, and the computer’s camera is a supported choice. Both are labelled as the certified identity provider.',
  },
  {
    id: 'checks',
    title: 'Identity checks',
    persona: 'individual',
    route: `${J}/checks`,
    caption:
      'Document authenticity, liveness and face match, with up to three attempts. Option 2 is a fallback only when Option 1 cannot support the document.',
  },
  {
    id: 'address',
    title: 'Proof of address',
    persona: 'individual',
    route: `${J}/address`,
    caption:
      'Everyone is asked for one proof of address dated within six months. Other supporting evidence appears only for an expired document or a name change.',
  },
  {
    id: 'idle-individual',
    title: 'Idle timeout, individual',
    persona: 'individual',
    route: `${J}/address`,
    caption:
      'After 30 minutes without activity an individual is warned a minute before sign-out. Shown here for demonstration only.',
    idle: 'individual',
  },
  {
    id: 'b2c',
    title: 'B2C: suggested ACSPs',
    persona: 'b2c',
    route: '/verify',
    caption:
      'A client who comes directly sees ACSPs ranked by clear criteria, not AI, each with its own fee and turnaround. One request for a different ACSP is allowed. An administrator confirms the allocation.',
  },
  {
    id: 'queue',
    title: 'ACSP review queue',
    persona: 'reviewer',
    route: '/acsp/queue',
    caption:
      'Cases with a review countdown, route, flags and source: referred, direct or the ACSP’s own client. Own clients carry no platform fee.',
  },
  {
    id: 'case-difference',
    title: 'Flagged difference',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000127',
    caption:
      'A name difference against the register is flagged, not halted. The reviewer records a decision and a reason, and the prompt to report it to Companies House is logged.',
  },
  {
    id: 'case-messages',
    title: 'Case messages and proof of address',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000129',
    caption:
      'A secure message thread with email notifications, and a proof of address dated outside six months. Referral Partners never see messages.',
  },
  {
    id: 'submit',
    title: 'Submit to Companies House',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000118/submit',
    caption:
      'The ACSP signs in with its own GOV.UK One Login. The platform prepares the submission and records the verification reference. It never holds the personal code.',
  },
  {
    id: 'filings',
    title: 'Route B filing handoff',
    persona: 'reviewer',
    route: '/acsp/filings',
    caption:
      'Filings and register corrections are prepared here, then handed to the ACSP’s own WebFiling account. The ACSP enters the authentication code itself.',
  },
  {
    id: 'record',
    title: 'Verification record',
    persona: 'reviewer',
    route: '/records/EO-2026-000118',
    caption:
      'Attribution, decision time, seven-year retention, rule set, verification reference and a hash-chained audit trail. Export sits behind step-up.',
  },
  {
    id: 'billing',
    title: 'ACSP billing',
    persona: 'reviewer',
    route: '/acsp/billing',
    caption:
      'Referred cases carry a platform fee of £69 plus VAT, deducted from the payment. Own clients are on the subscription, with the price not set.',
  },
  {
    id: 'idle-professional',
    title: 'Idle timeout, professional',
    persona: 'reviewer',
    route: '/acsp/billing',
    caption:
      'After 15 minutes without activity a professional is warned a minute before sign-out. Shown here for demonstration only.',
    idle: 'professional',
  },
  {
    id: 'matching',
    title: 'Matching and allocation',
    persona: 'platformAdmin',
    route: '/admin/matching',
    caption:
      'Structured criteria and the eligible ACSPs with reasons. The ranking is deterministic and shown, and an administrator confirms the allocation.',
  },
  {
    id: 'monitoring',
    title: 'ACSP lapse and monitoring',
    persona: 'platformAdmin',
    route: '/admin/monitoring',
    caption:
      'Two published lists are checked, and the yearly list upload cross-checks every name. A lapse pauses new cases and lists the cases that ACSP verified.',
  },
  {
    id: 'storage',
    title: 'Storage and retention',
    persona: 'platformAdmin',
    route: '/admin/storage',
    caption:
      'What is kept and where, for seven years from decision, with an indicative estimate. Four storage questions remain open for the client.',
  },
  {
    id: 'fees',
    title: 'Fees and plans',
    persona: 'superAdmin',
    route: '/admin/fees',
    caption:
      'Only a Super Administrator proposes fee changes, and a second approver publishes them. The four fee types are never merged.',
  },
  {
    id: 'commissions',
    title: 'Referral commissions',
    persona: 'superAdmin',
    route: '/admin/commissions',
    caption:
      'Commissions are off at launch. The switch, disclosure and consent records can be shown in a draft, with a second approver.',
  },
  {
    id: 'rules',
    title: 'Rules and publication',
    persona: 'superAdmin',
    route: '/rules',
    caption:
      'Every rule has an ID, an outcome and a source. Changes create a draft, and a second approver publishes it. No rule is evaluated by AI.',
  },
  {
    id: 'language',
    title: 'Languages, Arabic right to left',
    persona: 'individual',
    route: `${J}/invite`,
    caption:
      'Choose Arabic in the language switch to see the journey mirrored right to left. English remains the version of record.',
  },
  {
    id: 'points',
    title: 'Points for the call',
    persona: 'superAdmin',
    route: '/points',
    caption:
      'Open decisions for the client, each marked Pending your decision. This page is for the presenter only.',
  },
]
