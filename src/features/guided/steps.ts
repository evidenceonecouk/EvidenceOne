import { acceptanceScenarios } from '@/data/acceptanceScenarios'
import type { PersonaId } from '@/types/domain'

export interface GuidedStep {
  id: string
  /** Short heading shown on the caption card. */
  title: string
  persona: PersonaId
  route: string
  /** One or two sentences. Plain, calm, no hype. */
  caption: string
  /** The ACSP the ACSP persona acts as on this step. */
  acspId?: string
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
      'The ACSP gives its regulatory status, the cases it accepts and its fee. Connect payments hands off to the secure payment provider, which collects the business, representative and payout details. Evidence One holds no bank details. This step is subject to the payment provider’s confirmation. The application ends in Pending platform approval.',
  },
  {
    id: 'approvals',
    title: 'Platform Administrator approves',
    persona: 'platformAdmin',
    route: '/admin/approvals',
    caption:
      'The Platform Administrator approves ACSPs and Referral Partners. For an ACSP the two gates sit side by side: the payment provider’s eligibility and Evidence One’s approval. Payments are active only when both are met. This role manages allocation and monitoring, and cannot read identity evidence.',
  },
  {
    id: 'portfolio',
    title: 'Referral Partner portfolio',
    persona: 'partner',
    route: '/partner',
    caption:
      'Companies, directors and PSCs with status and check results: Invited, In progress, Further information required, Completed or Declined. Never documents or messages. When an ACSP lapses, the Partner is notified of its own affected clients only.',
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
    title: 'Single referral',
    persona: 'partner',
    route: '/partner/companies/99520316/invite',
    caption:
      'Pre-filled client details, then the 2 or 3 best matched ACSPs, each with its own fee and turnaround. Ranked by clear criteria, not AI. The Partner selects one and chooses who pays: the client, or the Partner with a single-use Agent Payment Code.',
  },
  {
    id: 'bulk-request',
    title: 'Bulk / Bespoke Request',
    persona: 'partner',
    route: '/partner/requests',
    caption:
      'For several clients or a mix of services, the Partner writes a free-text request. The Platform Administrator agrees it in the message area and converts it into linked cases, with a greyed placeholder for the corporate verification.',
  },
  {
    id: 'bulk-convert',
    title: 'Convert to linked cases',
    persona: 'platformAdmin',
    route: '/admin/requests',
    caption:
      'The Platform Administrator converts an agreed request into one Bulk Request with individual verification cases and a placeholder for additional Companies House services. Every step is audited.',
  },
  {
    id: 'invite',
    title: 'The individual opens the invite',
    persona: 'individual',
    route: `${J}/invite`,
    caption:
      'The journey runs in the browser, in a phone frame or on a desktop. There is no Evidence One app to install.',
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
    title: 'Instruct the ACSP and authorise payment',
    persona: 'individual',
    route: `${J}/instruct`,
    caption:
      'The person sees who will verify them, the fee and the turnaround, and that Evidence One is the ACSP’s technology provider. The card is then authorised and nothing is taken yet. When the ACSP approves, the payment is taken, the £69 plus VAT platform fee is deducted on referred and B2C cases, and the invoice is issued in the ACSP’s name. On a decline or an ACSP lapse nothing is taken.',
  },
  {
    id: 'document',
    title: 'One identity document, in the browser',
    persona: 'individual',
    route: `${J}/document`,
    caption:
      'On a computer, the identity step hands off to the phone or tablet by QR code or link. The person finishes the certified identity provider’s journey there and the computer shows the result. On a phone it is direct. There is no webcam-only route.',
  },
  {
    id: 'chip',
    title: 'Passport chip',
    persona: 'individual',
    route: `${J}/chip`,
    caption:
      'A biometric passport’s chip is read by the identity provider’s own chip reader on the person’s phone, inside the same journey. It is not an Evidence One app. If the chip is not read, the case continues and the reviewer records why they are satisfied.',
  },
  {
    id: 'selfie',
    title: 'Liveness and face match',
    persona: 'individual',
    route: `${J}/selfie`,
    caption:
      'Liveness and face match run in the certified identity provider’s journey on the phone or tablet. A phone camera gives a clearer result.',
  },
  {
    id: 'checks',
    title: 'Identity checks',
    persona: 'individual',
    route: `${J}/checks`,
    caption:
      'Document authenticity and security features, the chip where the document has one, liveness and face match, with up to three attempts. Option 2 is a fallback only when Option 1 cannot support the document, or the person has no smartphone or tablet. It goes through the identity provider’s manual document review, subject to the provider confirming it can. The ACSP completes any further checks and decides.',
  },
  {
    id: 'address',
    title: 'Proof of address',
    persona: 'individual',
    route: `${J}/address`,
    caption:
      'Everyone is asked: “Please provide a document confirming your current residential address, dated within the last 6 months.” Other supporting evidence appears only for an expired document or a name change. Bank statement redaction is an option available after go-live.',
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
    acspId: 'acsp-harcourt',
    route: '/acsp/cases/EO-2026-000127',
    caption:
      'A name difference against the register is flagged, not halted, and the prompt to report it to Companies House is logged. Here the reviewer chose Correction needed, an outcome of the Mandatory decision, and raised a correction fee. The client approved the revised total, so the case waits for the register correction. Approve stays disabled until Register corrected is ticked.',
  },
  {
    id: 'case-correction-paid',
    title: 'Correction approved, payment taken',
    persona: 'reviewer',
    route: '/records/EO-2026-000124',
    acspId: 'acsp-pellrowe',
    caption:
      'A case already past the correction branch. On Approve the payment was taken once: the verification fee and the correction add-on go to the ACSP, and the £69 plus VAT platform fee was deducted once. The invoice in the ACSP’s name itemises both lines. Declining, or an ACSP lapse, releases both authorisations.',
  },
  {
    id: 'case-option2',
    title: 'Option 2 through the identity provider',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000132',
    acspId: 'acsp-harcourt',
    caption:
      'Three attempts at the digital checks did not pass, so Option 2 was offered. The provider’s trained reviewers return findings, and the ACSP ticks its additional checks and records why it is satisfied. The decision stays with the ACSP. Subject to provider confirmation.',
  },
  {
    id: 'case-chip',
    title: 'Security features validated',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000131',
    caption:
      'Every case shows what the certified identity provider validated, including whether a chip was read. Here the chip was not read: the case continues, and the reviewer records why they are satisfied before approving. On approval the payment is taken.',
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
    id: 'message-warning',
    title: 'Messages carry no codes',
    persona: 'reviewer',
    route: '/acsp/cases/EO-2026-000118',
    caption:
      'Case messages are for questions about the verification. A notice under the composer says not to send Companies House codes, passwords or other access credentials, and text that looks like a code is not sent until it is edited. Companies House emails the personal code to the person, and the next day the platform only asks whether it has arrived. There is no code sharing feature in Gate 2.',
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
      'Filings are prepared and checked here and filed from the ACSP’s own WebFiling account, where the ACSP enters the authentication code itself. Available on subscription plans only, and an option after go-live.',
  },
  {
    id: 'record',
    title: 'Verification record',
    persona: 'reviewer',
    route: '/records/EO-2026-000118',
    caption:
      'Attribution, decision time, seven-year retention with liveness media kept for the same period, rule set, verification reference and a hash-chained audit trail. Export behind step-up, straight after approval or later on request to an administrator. No code is part of the record.',
  },
  {
    id: 'billing',
    title: 'ACSP billing',
    persona: 'reviewer',
    route: '/acsp/billing',
    caption:
      'Referred and B2C cases carry the £69 plus VAT platform fee, deducted when the payment is taken on approval. For its own clients an ACSP chooses Easy, Pro or Scale. Prices are provisional, referred cases never count towards the allowance, and extra own-client cases are £5.',
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
      'Two published lists are checked every two weeks, and the yearly list upload sits beside that check. A Not yet listed ACSP has 3 months to register. A lapse pauses new cases, lists the cases that ACSP verified for the administrator and the ACSP, and notifies each Referral Partner of its own affected clients.',
  },
  {
    id: 'storage',
    title: 'Storage and retention',
    persona: 'platformAdmin',
    route: '/admin/storage',
    caption:
      'Records are kept seven years from the decision, liveness media included. With a paid subscription records stay in live storage; without one they move to archive. An administrator releases a requested export without opening the evidence.',
  },
  {
    id: 'fees',
    title: 'Fees and plans',
    persona: 'superAdmin',
    route: '/admin/fees',
    caption:
      'Only a Super Administrator proposes a change to the £69 platform fee or the Easy, Pro and Scale packages, and a second approver publishes it. The four fee types are never merged; the subscription is a separate plan charge.',
  },
  {
    id: 'complaints',
    title: 'Complaints and refunds',
    persona: 'platformAdmin',
    route: '/admin/complaints',
    caption:
      'A Platform Administrator handles complaints and refunds. A refund needs a reason and step-up and is audited. What happens to the £69 on a refunded case is still open.',
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
      'Language help is an option available after go-live. Choose Arabic in the language switch to see the journey mirrored right to left. English remains the version of record. The presenter menu can hide every held option.',
  },
  {
    id: 'acceptance',
    title: 'Gate 2 acceptance scenarios',
    persona: 'superAdmin',
    route: '/acceptance',
    caption:
      'The client expects eight end-to-end scenarios to form part of the formal Gate 2 acceptance testing. This presenter-only page opens each one, and the Guided demo menu has a walkthrough that steps through them.',
  },
  {
    id: 'points',
    title: 'Decisions and open points',
    persona: 'superAdmin',
    route: '/decisions',
    caption:
      'What the client has decided, with dates, and what is still open. This page is for the presenter only.',
  },
]

export type GuidedTrack = 'story' | 'acceptance'

/** The Gate 2 acceptance walkthrough: every screen of the eight scenarios, in order. */
export const acceptanceSteps: GuidedStep[] = acceptanceScenarios.flatMap((s) =>
  s.screens.map((screen, i) => ({
    id: `acceptance-${s.number}-${i + 1}`,
    title: `Scenario ${s.number}: ${screen.label}`,
    persona: screen.persona,
    acspId: screen.acspId,
    route: screen.route,
    caption: screen.caption,
  })),
)

export const stepsFor = (track: GuidedTrack | undefined): GuidedStep[] =>
  track === 'acceptance' ? acceptanceSteps : guidedSteps

export const TRACK_LABEL: Record<GuidedTrack, string> = {
  story: 'Guided demo',
  acceptance: 'Gate 2 acceptance walkthrough',
}
