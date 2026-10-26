/*
  Presenter-only "Decisions and open points". Decided points carry the date
  the client decided them; open points are built as settings and carry the
  "Pending your decision" badge. Nothing here chooses on the client's behalf.
*/

export interface DecidedPoint {
  code?: string
  title: string
  summary: string
  /** When the client decided, for example "19 Oct". */
  decided: string
}

export interface ChangedPoint {
  code?: string
  title: string
  summary: string
}

export interface OpenPoint {
  code?: string
  title: string
  summary: string
  /** Awaiting a provider, not the client. Shows \"Subject to provider confirmation\". */
  providerConfirmation?: boolean
}

export const decidedPoints: DecidedPoint[] = [
  {
    code: 'H1',
    title: 'Expired passports',
    summary:
      'Not accepted. The person is asked for another document. The client has asked the identity provider what it supports. Subject to provider confirmation.',
    decided: '19 Oct',
  },
  {
    code: 'H2',
    title: 'SMS and step-up',
    summary:
      'SMS is used for one-time codes and confirming mobile numbers, never for step-up.',
    decided: '19 Oct',
  },
  {
    code: 'M2',
    title: 'Timeline',
    summary:
      'Gates 2 to 5 agreement for signature by Friday 30 October 2026. Gate 2 starts the next business day after signature.',
    decided: '19 and 20 Oct',
  },
  {
    code: 'M3',
    title: 'Clients affected by a lapsed ACSP',
    summary:
      'A Referral Partner is notified of its own affected clients and sees only those, with status and which ACSP lapsed.',
    decided: '19 Oct',
  },
  {
    code: 'M4',
    title: 'Registering with Companies House',
    summary:
      'A Not yet listed ACSP has 3 months to register. The yearly list upload sits beside the two-weekly check.',
    decided: '19 Oct',
  },
  {
    code: 'M7',
    title: 'Next-day code prompt',
    summary:
      'The day after Companies House confirms, the person is asked whether the code has arrived. The prompt never asks for the code.',
    decided: '19 Oct',
  },
  {
    code: 'P1',
    title: 'Chip reading and Option 1',
    summary:
      'Biometric passports are read in the identity provider’s chip reader on the person’s phone, within the same provider journey.',
    decided: '19 Oct',
  },
  {
    code: 'P2',
    title: 'Route B',
    summary: 'Filings are available on subscription plans only.',
    decided: '19 Oct',
  },
  {
    code: 'P3',
    title: 'Proof of address wording',
    summary:
      '“Please provide a document confirming your current residential address, dated within the last 6 months.”',
    decided: '19 Oct',
  },
  {
    code: 'G2-12, G2-18',
    title: 'Messages carry no codes',
    summary:
      'Case messages are for verification-related communication only. Evidence One does not ask for, collect or intentionally store Companies House codes. Companies House sends the personal code to the person.',
    decided: '23 Oct',
  },
  {
    code: 'P6',
    title: 'PEP and sanctions screening',
    summary: 'Optional, switched on or off by each ACSP.',
    decided: '19 Oct',
  },
  {
    code: 'P7',
    title: 'AI processing location',
    summary: 'Processing in the UK, with no training and no retention.',
    decided: '19 Oct',
  },
  {
    code: 'P8',
    title: 'Ranking ACSP suggestions',
    summary:
      'Ranked by clear criteria, never by AI. Criteria and reasons are shown.',
    decided: '19 Oct',
  },
  {
    code: 'P9',
    title: 'Language review',
    summary: 'The client arranges a reviewer for each language before go-live.',
    decided: '20 Oct',
  },
  {
    code: 'P10',
    title: 'Payment, complaints and refunds',
    summary:
      'The card is authorised at instruction and charged only on approval. Platform Administrators handle complaints and refunds.',
    decided: '19 and 20 Oct',
  },
  {
    code: 'P11',
    title: 'Referral Partners outside the UK',
    summary: 'See status only.',
    decided: '19 Oct',
  },
  {
    title: 'Identity provider',
    summary:
      'Chosen. Shown everywhere as the certified identity provider and never named.',
    decided: '22 Oct',
  },
  {
    title: 'Options',
    summary:
      'O1 language help, O2 Route B Tier 1 filings and O3 bank statement redaction are held until after go-live. O4 Bulk / Bespoke Request is included.',
    decided: '22 Oct',
  },
  {
    title: 'Liveness media',
    summary: 'Kept for seven years with the case.',
    decided: '20 Oct',
  },
  {
    title: 'Storage',
    summary:
      'Live storage with a subscription, archive storage without one, 10 MB a file and five files per request, export on approval or on request.',
    decided: '19 Oct',
  },
  {
    title: 'Subscription packages',
    summary: 'Easy, Pro and Scale, provisional.',
    decided: '15 Oct',
  },
]

/** Decided earlier, then changed by the client. Shown apart from Decided. */
export const changedPoints: ChangedPoint[] = [
  {
    code: 'P4',
    title: 'Codes through case messages',
    summary:
      'Decided 19 and 20 October. Reversed by the client on 23 October: not part of Gate 2, and may return later if ACSPs show a genuine commercial need.',
  },
]

export const openPoints: OpenPoint[] = [
  {
    code: 'G2-02',
    title: 'Connect payments at ACSP onboarding',
    summary:
      'The ACSP connects payments through the secure payment provider’s own onboarding. Payments activate only when the provider’s requirements and Evidence One’s approval are both met. Subject to the payment provider’s confirmation.',
    providerConfirmation: true,
  },
  {
    code: 'G2-14',
    title: 'Option 2 through the identity provider',
    summary:
      'The provider’s manual document review does the supported checks and returns findings. The ACSP completes any additional checks and keeps the decision. Whether it replaces an ACSP-run trained check is still open.',
    providerConfirmation: true,
  },
  {
    code: 'G2-08, G2-09',
    title: 'Expired and non-biometric passports, optional checks, PEP pricing',
    summary:
      'Held for the identity provider’s answers. H1 stays as decided meanwhile: expired passports are not accepted, and every expiry allowance is 0. Raised by the client on 22 and 23 October.',
    providerConfirmation: true,
  },
  {
    title: 'Register correction fee flow',
    summary:
      'Who carries out the correction and by which route, who pays the add-on under an Agent Payment Code, the Partner status mapping, the second authorisation, and one £69 fee per case. Design interpretations to confirm.',
  },
  {
    title: 'Code-like text in messages',
    summary:
      'Whether text that looks like a code should block the message until it is edited, rather than send with a warning. Design interpretation; wording to confirm.',
  },
  {
    title: 'ACSP without active payments',
    summary:
      'Whether an ACSP whose payments are not active is excluded from allocation and referral matching (MATCH-09). The demo assumes yes.',
  },
  {
    code: 'P5',
    title: 'Which form “ACSP04” means',
    summary:
      'Corrections to a submitted verification use ACSP04, never a resubmission.',
  },
  {
    title: 'The £69 on a refunded case',
    summary: 'What happens to the platform fee when a payment is refunded.',
  },
  {
    title: 'No smartphone or tablet',
    summary:
      'A person with neither is offered Option 2, handled through the identity provider’s manual document review, with the ACSP completing any further checks and deciding. Subject to the provider confirming it can. Raised on 23 October.',
  },
  {
    title: 'Chip not read',
    summary:
      'Handled as a Flag and a Mandatory decision for the reviewer. Design interpretation of the 13 October determination; wording to confirm.',
  },
  {
    title: 'Electronic address check and proof of address',
    summary:
      'Whether a passing electronic address check for a UK resident removes the proof of address document. The document is requested by default.',
  },
  {
    title: 'Return from the provider journey',
    summary:
      'Whether the person returns to our page after the check, and where the chip step sits. The provider is to confirm; the demo simulates both.',
  },
  {
    title: 'Chip reading hosted in the EU',
    summary:
      'The provider’s chip reading is hosted in the EU, which the UK-only point may need covered in the contract.',
  },
  {
    title: 'Subscription prices',
    summary:
      'Final prices and structure of Easy, Pro and Scale before go-live.',
  },
  {
    title: 'ICO registration',
    summary: 'The registration number has not been issued.',
  },
  {
    title: 'Liveness media and the data framework',
    summary:
      'Whether keeping liveness media for seven years needs the client’s data framework updated.',
  },
]
