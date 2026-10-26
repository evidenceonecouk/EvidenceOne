import type { PersonaId } from '@/types/domain'

/*
  Gate 2 acceptance scenarios (client email of 23 October). The client wants
  Gate 2 accepted as a working, testable end-to-end verification workflow, not
  as isolated features. These eight scenarios form part of the formal Gate 2
  acceptance testing. In the demo they live on a presenter-only page and a
  guided track. Each is marked "Shown in this demo", "Simulated" or "Depends on
  provider confirmation".
*/

export type ScenarioStatus = 'shown' | 'simulated' | 'depends'

export const SCENARIO_STATUS_LABEL: Record<ScenarioStatus, string> = {
  shown: 'Shown in this demo',
  simulated: 'Simulated',
  depends: 'Depends on provider confirmation',
}

export interface ScenarioScreen {
  label: string
  route: string
  persona: PersonaId
  /** The ACSP the ACSP persona acts as for this screen. */
  acspId?: string
  /** What the guided track says on this screen. */
  caption: string
}

export interface AcceptanceScenario {
  number: number
  title: string
  persona: PersonaId
  status: ScenarioStatus
  screens: ScenarioScreen[]
  /** What is simulated in the demo. */
  simulated: string
  /** What depends on a provider's confirmation. */
  dependsOnProvider: string
}

export const ACCEPTANCE_STATEMENT =
  'These scenarios form part of the formal Gate 2 acceptance testing.'

const HARCOURT = 'acsp-harcourt'
const PELL = 'acsp-pellrowe'

export const acceptanceScenarios: AcceptanceScenario[] = [
  {
    number: 1,
    title:
      'Register two independent ACSPs and approve their accounts through the administrator portal',
    persona: 'platformAdmin',
    status: 'shown',
    screens: [
      {
        label: 'ACSP onboarding, with Connect payments',
        route: '/join/acsp',
        persona: 'reviewer',
        caption:
          'Scenario 1. An ACSP registers: regulatory status, who verifies, cases accepted and fees. The Connect payments step hands off to the secure payment provider and holds no bank details. Two applications are already seeded so this is quick.',
      },
      {
        label: 'Administrator approval, two gates',
        route: '/admin/approvals',
        persona: 'platformAdmin',
        caption:
          'Scenario 1. The Platform Administrator approves each ACSP. Payments are active only when the provider’s eligibility and Evidence One’s approval are both met. The second seeded application shows More information needed.',
      },
    ],
    simulated:
      'The provider-hosted payment onboarding is a simulated hand-off with a simulated return. Two applications are seeded so the onboarding need not be repeated live.',
    dependsOnProvider:
      'Connect payments is subject to the secure payment provider’s confirmation (G2-02).',
  },
  {
    number: 2,
    title: 'Assign separate clients and verification cases to each ACSP',
    persona: 'platformAdmin',
    status: 'shown',
    screens: [
      {
        label: 'Allocation, administrator view',
        route: '/admin/matching',
        persona: 'platformAdmin',
        caption:
          'Scenario 2. The administrator sees matching and allocation. An ACSP without active payments is not offered. Ranked by clear criteria. Not AI.',
      },
      {
        label: 'ACSP A review queue',
        route: '/acsp/queue',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 2. ACSP A sees only its own cases: referred, B2C and own-client.',
      },
      {
        label: 'ACSP B review queue',
        route: '/acsp/queue',
        persona: 'reviewer',
        acspId: PELL,
        caption:
          'Scenario 2. ACSP B has its own, separate queue and its own clients.',
      },
    ],
    simulated: 'Allocation to the seeded cases is shown, not performed live.',
    dependsOnProvider: 'None.',
  },
  {
    number: 3,
    title:
      'Complete the provider verification journey: document validation, facial recognition and liveness',
    persona: 'individual',
    status: 'simulated',
    screens: [
      {
        label: 'Choose a document',
        route: '/journey/EO-2026-000135/document',
        persona: 'individual',
        caption:
          'Scenario 3. The person chooses one document from the Option 1 list. Expired passports are not accepted.',
      },
      {
        label: 'Document, chip and phone hand-off',
        route: '/journey/EO-2026-000135/scan',
        persona: 'individual',
        caption:
          'Scenario 3. Document validation inside the certified identity provider’s journey. On a computer the person finishes on a phone by QR code or link. The chip is read in the provider’s own chip reader where the document has one.',
      },
      {
        label: 'Liveness and face match',
        route: '/journey/EO-2026-000135/selfie',
        persona: 'individual',
        caption:
          'Scenario 3. Facial recognition and liveness, with up to three attempts. The result returns to the same case.',
      },
    ],
    simulated:
      'The whole provider journey, its return to Evidence One and the chip step are simulated placeholders.',
    dependsOnProvider:
      'Whether the provider returns the person to our page, and where the chip step sits, are still to be confirmed.',
  },
  {
    number: 4,
    title:
      'Reviewer journey: approval, request for further information and rejection, with the required authentication controls',
    persona: 'reviewer',
    status: 'shown',
    screens: [
      {
        label: 'Review a case',
        route: '/acsp/cases/EO-2026-000131',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 4. The reviewer reads the evidence, rule results and AI observations. Approve, Request information and Decline each ask for step-up. Approve stays disabled until no Block or Halt is open and every Mandatory decision has a reason.',
      },
      {
        label: 'Request information',
        route: '/acsp/cases/EO-2026-000129',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 4. A request for further information, here for a proof of address dated outside six months. The individual is told by email and in the case messages.',
      },
      {
        label: 'Rejection message',
        route: '/journey/EO-2025-000088/status',
        persona: 'individual',
        caption:
          'Scenario 4. When a case is declined the individual sees the rejection message, and nothing is taken from the card.',
      },
    ],
    simulated: 'Step-up is a simulated passkey or authenticator confirmation.',
    dependsOnProvider: 'None.',
  },
  {
    number: 5,
    title: 'Neither ACSP can access, view or modify the other ACSP’s records',
    persona: 'reviewer',
    status: 'shown',
    screens: [
      {
        label: 'ACSP B opens ACSP A’s case by link',
        route: '/acsp/cases/EO-2026-000127',
        persona: 'reviewer',
        acspId: PELL,
        caption:
          'Scenario 5. ACSP B opens a case held by ACSP A. It shows no case data, no names and no documents, and offers no action. The refusal is written to ACSP B’s own audit chain with a case reference only.',
      },
      {
        label: 'The same refusal on the record',
        route: '/records/EO-2026-000127',
        persona: 'reviewer',
        acspId: PELL,
        caption:
          'Scenario 5. The record, the submission workspace and the export are refused in the same way. The store refuses the actions too, not only the screens.',
      },
      {
        label: 'ACSP B’s own audit chain',
        route: '/records',
        persona: 'reviewer',
        acspId: PELL,
        caption:
          'Scenario 5. ACSP B can export its own audit chain, which now holds the Access refused entries.',
      },
    ],
    simulated: 'None. The refusal is real in the demo.',
    dependsOnProvider: 'None.',
  },
  {
    number: 6,
    title:
      'A failed verification and the applicable Option 2 fallback, subject to the provider’s confirmed capabilities',
    persona: 'reviewer',
    status: 'depends',
    screens: [
      {
        label: 'Option 1 attempts used',
        route: '/journey/EO-2026-000132/option-2',
        persona: 'individual',
        caption:
          'Scenario 6. Three attempts at the digital checks did not pass, so Option 2 is offered. The identity provider’s trained reviewers check the documents, and the ACSP completes any further checks and decides.',
      },
      {
        label: 'Option 2 case review',
        route: '/acsp/cases/EO-2026-000132',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 6. The provider’s findings are returned, and the ACSP’s additional checks are in progress. Approve stays disabled until the checklist is complete and a reason is recorded.',
      },
    ],
    simulated:
      'The provider’s manual document review and its findings are simulated.',
    dependsOnProvider:
      'The provider has yet to confirm that its manual document review can meet the Companies House requirements (G2-14), and what it supports for expired and non-biometric passports (G2-08 and G2-09).',
  },
  {
    number: 7,
    title: 'Generate and export the verification audit trail',
    persona: 'reviewer',
    status: 'shown',
    screens: [
      {
        label: 'Verification record',
        route: '/records/EO-2026-000118',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 7. The hash-chained audit trail for the case, with short hashes. Export it, behind step-up, as a file with event type, actor, timestamp and hashes. No document content and no codes.',
      },
      {
        label: 'All records and the whole chain',
        route: '/records',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 7. The ACSP can also export its whole audit chain. Each export is itself audited.',
      },
    ],
    simulated: 'The step-up is simulated.',
    dependsOnProvider: 'None.',
  },
  {
    number: 8,
    title:
      'Companies House submission handoff and recording of the confirmation',
    persona: 'reviewer',
    status: 'simulated',
    screens: [
      {
        label: 'Submission workspace',
        route: '/acsp/cases/EO-2026-000118/submit',
        persona: 'reviewer',
        acspId: HARCOURT,
        caption:
          'Scenario 8. After approval the ACSP signs in with its own One Login and submits through the Companies House service. The workspace lists every field in service order. It holds no code, and says so.',
      },
      {
        label: 'Code arrived, next day',
        route: '/journey/EO-2026-000118/status',
        persona: 'individual',
        acspId: HARCOURT,
        caption:
          'Scenario 8. The day after Companies House confirms, the individual is asked whether the code has arrived. It never asks for the code.',
      },
    ],
    simulated:
      'The hand-off to Companies House and the return are an Evidence One interstitial, never a copy of a GOV.UK or Companies House screen.',
    dependsOnProvider: 'None.',
  },
]
