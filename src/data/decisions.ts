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

export interface OpenPoint {
  code?: string
  title: string
  summary: string
}

export const decidedPoints: DecidedPoint[] = [
  {
    code: 'H1',
    title: 'Expired passports',
    summary: 'Not accepted. The person is asked for another document.',
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
    code: 'P4',
    title: 'Passing codes to the ACSP',
    summary:
      'Through a dedicated code message in the case messages, deleted automatically 30 days after the ACSP marks it received.',
    decided: '19 and 20 Oct',
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

export const openPoints: OpenPoint[] = [
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
      'A person with neither is offered Option 2, a request to the ACSP for a trained human check. Raised on 23 October.',
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
