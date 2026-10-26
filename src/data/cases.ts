import type { AuditInput } from '@/lib/audit'
import { DEFAULT_BILLING_SETTINGS, splitPayment } from '@/lib/fees'
import { SLA_HOURS } from '@/lib/format'
import type {
  AiObservation,
  CorrectionTask,
  EvidenceItem,
  IdvtResults,
  Invite,
  Payment,
  PaymentMethod,
  VerificationCase,
} from '@/types/domain'
import { assignClientInvoiceIds } from './billing'
import { buildPeople } from './people'

/*
  Cases in mixed statuses. Timestamps are relative to the moment the demo is
  seeded, so SLA countdowns are always live when a presenter opens the demo.

  The journey runs in the browser for everyone, through the certified identity
  provider. A biometric passport's chip is read by the provider's own chip
  reader on the person's phone; Evidence One reads no chip. Each case records
  the chip result (read, not read or not applicable). Every
  individual who reached review has one proof of current address dated within
  six months. Register differences are flagged for the reviewer, never halted.
*/

const HOUR = 3_600_000
const DAY = 24 * HOUR
const MIN = 60_000

/** Each ACSP's standard professional fee, VAT inclusive (from its profile). */
const FEE: Record<string, number> = {
  'acsp-harcourt': 150,
  'acsp-pellrowe': 120,
  'acsp-ashdown': 135,
  'acsp-northbank': 110,
  'acsp-fenwick': 49,
}
const ACSP_NAME: Record<string, string> = {
  'acsp-harcourt': 'Harcourt Lane Solicitors LLP',
  'acsp-pellrowe': 'Alison Pell, Chartered Accountant',
  'acsp-ashdown': 'Ashdown Trust Services Ltd',
  'acsp-northbank': 'Northbank Compliance Ltd',
  'acsp-fenwick': 'Fenwick & Shaw Chartered Accountants',
}
const REVIEWER_NAME: Record<string, string> = {
  'rev-marsh': 'Eleanor Marsh, Harcourt Lane',
  'rev-okoro': 'James Okoro, Harcourt Lane',
  'rev-pell': 'Alison Pell',
  'rev-basu': 'Anjali Basu, Northbank Compliance',
  'rev-shaw': 'Daniel Shaw, Fenwick & Shaw',
}
const PARTNER_ACTOR: Record<string, string> = {
  'partner-fenwick': 'Rachel Fenwick, Fenwick & Shaw',
  'partner-meridian': 'Oliver Grant, Meridian Gulf Corporate Services',
}
const PARTNER_NAME: Record<string, string> = {
  'partner-fenwick': 'Fenwick & Shaw Chartered Accountants',
  'partner-meridian': 'Meridian Gulf Corporate Services',
}

const passAll = (at: string, ref: string, score: number): IdvtResults => ({
  documentAuthenticity: 'pass',
  liveness: 'pass',
  faceMatch: 'pass',
  faceMatchScore: score,
  pepSanctions: 'pass',
  pepSanctionsDetail: 'No match on PEP, sanctions or adverse media lists.',
  registerComparison: 'pass',
  completedAt: at,
  providerReference: ref,
  attempts: 1,
})

const pending: IdvtResults = {
  documentAuthenticity: 'pending',
  liveness: 'pending',
  faceMatch: 'pending',
  pepSanctions: 'pending',
}

const PROVIDER = 'Certified identity provider'
const AI = 'Evidence One Intelligence'
const RULES = 'Evidence One rules'
const SYSTEM = 'Evidence One'
const AI_MODEL = 'Model tag: eo-assist-2026-09'

export function buildCases(now: number) {
  const at = (offsetMs: number) => new Date(now + offsetMs).toISOString()
  const people = buildPeople(now)
  const personName = (id: string) => {
    const p = people.find((x) => x.id === id)
    return p ? `${p.givenNames} ${p.familyName}` : 'The individual'
  }

  /**
    Agency payment, authorised when the client instructs the ACSP. settle()
    takes it on approval (with the split and a payout two days later) or
    releases it on a decline or an abandoned case.
  */
  const pay = (
    acspId: string,
    method: PaymentMethod,
    paidOffset: number,
    reference: string,
    who: { code?: string; payerName?: string } = {},
  ): Payment => {
    return {
      method,
      status: 'authorised',
      authorisedAt: at(paidOffset),
      amount: FEE[acspId],
      payeeAcspId: acspId,
      code: who.code,
      payerName: who.payerName,
      reference,
    }
  }

  /** Payment is taken on approval and released on a decline, a lapse or an ACSP lapse (P10). */
  const settle = (c: VerificationCase): VerificationCase => {
    const p = c.payment
    if (!p) return c
    const approved = c.decision?.outcome === 'approve'
    if (approved) {
      const takenAt = c.decision!.decidedAt
      const s = splitPayment(p.amount, c.source, DEFAULT_BILLING_SETTINGS)
      const payoutMs = new Date(takenAt).getTime() + 2 * DAY
      const payment: Payment = {
        ...p,
        status: 'taken',
        paidAt: takenAt,
        providerFee: s.providerFee,
        platformFee: s.platformFee,
        platformFeeVat: s.platformFeeVat,
        netPayout: s.net,
        payoutAt:
          payoutMs <= now ? new Date(payoutMs).toISOString() : undefined,
      }
      return { ...c, payment }
    }
    const releasedAt =
      c.decision?.outcome === 'decline'
        ? c.decision.decidedAt
        : c.status === 'abandoned'
          ? c.closedAt
          : c.reallocation?.offeredAt
    if (!releasedAt) return c
    const payment: Payment = {
      ...p,
      status: 'released',
      releasedAt,
      releaseReason:
        c.status === 'abandoned'
          ? 'Case abandoned before a decision'
          : c.reallocation
            ? `${ACSP_NAME[c.reallocation.fromAcspId]} lapsed before a decision`
            : 'Verification declined',
    }
    return { ...c, payment }
  }

  const doc = (
    id: string,
    label: string,
    offset: number,
    note = 'Checked by the certified identity provider in the browser.',
  ): EvidenceItem => ({
    id,
    kind: 'identity_document',
    label,
    uploadedAt: at(offset),
    note,
  })
  const selfie = (id: string, offset: number): EvidenceItem => ({
    id,
    kind: 'selfie',
    label: 'Liveness capture, browser',
    uploadedAt: at(offset),
    note: 'Liveness media kept with the record for seven years.',
  })
  /** Proof of current address, dated `ageDays` before it was uploaded. */
  const proof = (
    id: string,
    label: string,
    type: EvidenceItem['supportingType'],
    uploadOffset: number,
    ageDays: number,
    extra: Partial<EvidenceItem> = {},
  ): EvidenceItem => ({
    id,
    kind: 'address_evidence',
    supportingType: type,
    label,
    uploadedAt: at(uploadOffset),
    documentDate: at(uploadOffset - ageDays * DAY),
    showsAddress: true,
    showsName: true,
    ...extra,
  })
  const obs = (
    id: string,
    step: AiObservation['step'],
    ruleId: string,
    severity: AiObservation['severity'],
    title: string,
    detail: string,
    source: string,
  ): AiObservation => ({
    id,
    step,
    ruleId,
    severity,
    title,
    detail: `${detail} AI observation. Advisory only.`,
    source: `${source}. ${AI_MODEL}`,
  })
  const regMatch = (id: string, who: string): AiObservation =>
    obs(
      id,
      'register',
      'REG-11',
      'info',
      'Name and date of birth agree with the register',
      `The details ${who} gave, the document and the Companies House officer record agree after normalisation.`,
      'Register comparison result',
    )
  const addrOk = (id: string, what: string): AiObservation =>
    obs(
      id,
      'evidence',
      'ADDL-12',
      'info',
      'Proof of address shows the declared address',
      `${what} shows the current address and the individual's name, and is dated within six months.`,
      'Proof of address, name, address and issue date (AI extraction)',
    )

  const partnerBase = (partnerId: string) => ({
    origin: 'partner_invite' as const,
    source: 'referred' as const,
    partnerId,
  })
  const invited = { source: 'invite' as const }

  const cases: VerificationCase[] = [
    // Margaret Ashby: confirmed, with a Companies House verification reference
    {
      id: 'EO-2026-000118',
      route: 'A',
      personId: 'p-margaret',
      companyNumber: '99418027',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-marsh',
      option: 1,
      status: 'confirmed',
      createdAt: at(-41 * DAY),
      submittedForReviewAt: at(-40 * DAY),
      slaDueAt: at(-40 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-40 * DAY - 2 * HOUR), 'IDV-7F31-0A92', 97.8),
      allocation: { ...invited, instructedAt: at(-41 * DAY + HOUR) },
      observations: [
        regMatch('o-118-1', 'Margaret'),
        addrOk('o-118-2', 'The council tax bill'),
      ],
      evidence: [
        doc(
          'ev-118-1',
          'UK passport, captured in the browser',
          -40 * DAY - 3 * HOUR,
        ),
        selfie('ev-118-2', -40 * DAY - 3 * HOUR),
        proof(
          'ev-118-3',
          'Council tax bill',
          'utility_bill',
          -40 * DAY - 2 * HOUR,
          62,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -41 * DAY + 2 * HOUR,
        'PAY-2026-004118',
        {
          code: 'APC-FS-K2M8',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
      decision: {
        outcome: 'approve',
        reasonCode: 'APR-01',
        note: 'All checks passed. Satisfied the person is who they claim to be.',
        decidedAt: at(-39 * DAY),
        reviewerId: 'rev-marsh',
        stepUpRef: 'SU-7Q2M-118A',
      },
      submission: {
        startedAt: at(-39 * DAY + HOUR),
        stepUpRef: 'SU-7Q2M-118B',
        fieldsDone: [
          'name',
          'former',
          'dob',
          'email',
          'doc',
          'method',
          'satisfied',
          'acsp',
          'statement',
        ],
        handedOffAt: at(-39 * DAY + 2 * HOUR),
        submittedAt: at(-39 * DAY + 2 * HOUR + 20 * MIN),
        confirmedAt: at(-39 * DAY + 3 * HOUR),
        verificationReference: 'CHV-2026-7KQ2MX',
        referenceSource: 'forwarded_email',
      },
      personalCodeReceipt: {
        askedAt: at(-38 * DAY + 3 * HOUR),
        answer: 'yes',
        answeredAt: at(-38 * DAY + 5 * HOUR),
      },
      // P4: the personal code passed to the ACSP as a code message, received and within its 30 days
      messages: [
        {
          id: 'msg-EO-2026-000118-1',
          from: 'individual',
          authorName: 'Margaret Ashby',
          at: at(-12 * DAY + 2 * HOUR),
          body: 'Hello Eleanor. Fenwick & Shaw have asked whether you could link my verified identity to Ashby & Daughters Bakery Ltd for me. Do you need my personal code for that?',
          notifiedAt: at(-12 * DAY + 2 * HOUR + MIN),
        },
        {
          id: 'msg-EO-2026-000118-2',
          from: 'reviewer',
          authorName: 'Eleanor Marsh',
          at: at(-12 * DAY + 5 * HOUR),
          body: 'Yes, we can do that for you. Please send the personal code as a code message, not as an ordinary message. Only I can open it, and it is deleted 30 days after I mark it received.',
          notifiedAt: at(-12 * DAY + 5 * HOUR + MIN),
        },
        {
          id: 'msg-EO-2026-000118-3',
          from: 'individual',
          authorName: 'Margaret Ashby',
          at: at(-11 * DAY - 3 * HOUR),
          body: 'K7QD4M2XP9R',
          notifiedAt: at(-11 * DAY - 3 * HOUR + MIN),
          kind: 'code',
          codeKind: 'personal_code',
          receivedAt: at(-11 * DAY),
          receivedBy: 'Eleanor Marsh',
          deleteOn: at(19 * DAY),
        },
      ],
    },

    // Thomas Ashby: proof of address dated seven months before upload, so a more recent one was requested
    {
      id: 'EO-2026-000129',
      route: 'A',
      personId: 'p-thomas',
      companyNumber: '99418027',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-marsh',
      option: 1,
      status: 'info_requested',
      createdAt: at(-6 * DAY),
      submittedForReviewAt: at(-4 * DAY),
      slaDueAt: at(-4 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-4 * DAY - 3 * HOUR), 'IDV-7F31-1C04', 96.4),
      allocation: { ...invited, instructedAt: at(-6 * DAY + HOUR) },
      observations: [
        obs(
          'o-129-1',
          'evidence',
          'ADDL-11',
          'attention',
          'Council tax bill appears to be older than six months',
          'The issue date read from the bill is about seven months before upload. A more recent document is needed for the Shrewsbury address.',
          'Council tax bill, issue date (AI extraction)',
        ),
      ],
      evidence: [
        doc(
          'ev-129-1',
          'UK photocard driving licence, captured in the browser',
          -4 * DAY - 4 * HOUR,
        ),
        selfie('ev-129-2', -4 * DAY - 4 * HOUR),
        proof(
          'ev-129-3',
          'Council tax bill',
          'utility_bill',
          -4 * DAY - 2 * HOUR,
          214,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -6 * DAY + 3 * HOUR,
        'PAY-2026-004129',
        {
          code: 'APC-FS-R7T3',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
      decision: {
        outcome: 'request_info',
        reasonCode: 'RFI-02',
        note: 'Please upload one proof of your current address, such as a bank statement or utility bill, dated within the last six months.',
        decidedAt: at(-2 * DAY),
        reviewerId: 'rev-marsh',
      },
      messages: [
        {
          id: 'msg-EO-2026-000129-1',
          from: 'reviewer',
          authorName: 'Eleanor Marsh',
          at: at(-2 * DAY + 5 * MIN),
          body: 'Hello Thomas. Thank you for completing your identity checks. The council tax bill you uploaded is dated about seven months ago. Could you upload one proof of your Shrewsbury address dated within the last six months?',
          notifiedAt: at(-2 * DAY + 6 * MIN),
        },
        {
          id: 'msg-EO-2026-000129-2',
          from: 'individual',
          authorName: 'Thomas Ashby',
          at: at(-2 * DAY + 3 * HOUR),
          body: 'Thanks Eleanor. That is the only bill I have to hand. Would a bank statement be acceptable instead?',
          notifiedAt: at(-2 * DAY + 3 * HOUR + MIN),
        },
        {
          id: 'msg-EO-2026-000129-3',
          from: 'reviewer',
          authorName: 'Eleanor Marsh',
          at: at(-1 * DAY - 4 * HOUR),
          body: 'Yes. A bank or credit card statement with recent transactions, or a utility bill, dated within the last six months is fine. It needs to show your name and the Shrewsbury address.',
          notifiedAt: at(-1 * DAY - 4 * HOUR + MIN),
        },
        {
          id: 'msg-EO-2026-000129-4',
          from: 'individual',
          authorName: 'Thomas Ashby',
          at: at(-1 * DAY - 2 * HOUR),
          body: 'Understood. I will download this month’s statement and upload it this evening.',
          notifiedAt: at(-1 * DAY - 2 * HOUR + MIN),
        },
      ],
    },

    // Priya Raman: biometric passport, chip NOT read in the provider's chip reader. IDVT-01 Flag and Mandatory decision. Bank statement with redaction.
    {
      id: 'EO-2026-000131',
      route: 'A',
      personId: 'p-priya',
      companyNumber: '99520316',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-2 * DAY),
      submittedForReviewAt: at(-14 * HOUR),
      slaDueAt: at(-14 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-14 * HOUR - 20 * MIN), 'IDV-7F31-2D17', 98.6),
        chipResult: 'not_read',
      },
      allocation: { ...invited, instructedAt: at(-2 * DAY + HOUR) },
      observations: [
        regMatch('o-131-1', 'Priya'),
        obs(
          'o-131-2',
          'evidence',
          'ADDL-12',
          'info',
          'Bank statement shows the declared address',
          'The statement shows Priya’s name, the Leeds address and an issue date within six months. Transaction amounts and payees were masked by Priya before upload and are not visible.',
          'Bank statement, name, address and issue date (AI extraction)',
        ),
      ],
      evidence: [
        doc(
          'ev-131-1',
          'UK passport, captured in the browser',
          -14 * HOUR - 30 * MIN,
        ),
        selfie('ev-131-2', -14 * HOUR - 30 * MIN),
        proof(
          'ev-131-3',
          'Bank statement, amounts and payees masked',
          'bank_statement',
          -14 * HOUR - 10 * MIN,
          19,
          {
            redaction: {
              status: 'confirmed_by_individual',
              confirmedAt: at(-14 * HOUR - 12 * MIN),
              masked: ['Transaction amounts', 'Payee names'],
            },
          },
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -2 * DAY + 2 * HOUR,
        'PAY-2026-004131',
        {
          code: 'APC-FS-H5W9',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
    },

    // Lucy Ashby: licence in the browser, former name declared (ADDL-03), one supporting document supplied
    {
      id: 'EO-2026-000133',
      route: 'A',
      personId: 'p-lucy',
      companyNumber: '99418027',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-3 * DAY),
      submittedForReviewAt: at(-26 * HOUR),
      slaDueAt: at(-26 * HOUR + SLA_HOURS * HOUR),
      idvt: passAll(at(-26 * HOUR - 15 * MIN), 'IDV-7F31-2C55', 96.1),
      journey: {
        documentType: 'driving_licence',
        formerNames: ['Lucy Rose Whitlock'],
      },
      allocation: { ...invited, instructedAt: at(-3 * DAY + HOUR) },
      observations: [
        regMatch('o-133-1', 'Lucy'),
        obs(
          'o-133-2',
          'evidence',
          'ADDL-13',
          'info',
          'Supporting document shows the declared former name',
          'Lucy declared the former name Lucy Rose Whitlock. The bank statement supplied shows that name and the current name, and is dated within six months.',
          'Bank statement, name and issue date (AI extraction)',
        ),
      ],
      evidence: [
        doc(
          'ev-133-1',
          'UK photocard driving licence, captured in the browser',
          -26 * HOUR - 25 * MIN,
          'Checked by the certified identity provider in the browser.',
        ),
        selfie('ev-133-2', -26 * HOUR - 25 * MIN),
        proof(
          'ev-133-3',
          'Council tax bill',
          'utility_bill',
          -26 * HOUR - 20 * MIN,
          41,
        ),
        proof(
          'ev-133-4',
          'Bank statement showing the former name (one supporting document, ADDL-03)',
          'bank_statement',
          -20 * HOUR,
          27,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -3 * DAY + 4 * HOUR,
        'PAY-2026-004133',
        {
          code: 'APC-FS-D8P2',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
    },

    // Sofia Lindqvist: three failed liveness attempts, so Option 2 person check
    {
      id: 'EO-2026-000132',
      route: 'A',
      personId: 'p-sofia',
      companyNumber: '99520316',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      option: 2,
      status: 'in_review',
      createdAt: at(-5 * DAY),
      submittedForReviewAt: at(-30 * HOUR),
      slaDueAt: at(-30 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        documentAuthenticity: 'pass',
        liveness: 'fail',
        faceMatch: 'not_applicable',
        pepSanctions: 'pass',
        pepSanctionsDetail:
          'No match on PEP, sanctions or adverse media lists.',
        registerComparison: 'pass',
        completedAt: at(-4 * DAY),
        providerReference: 'IDV-7F31-2B91',
        attempts: 3,
      },
      option2: {
        reason: 'attempts_used',
        requestedAt: at(-4 * DAY + 10 * MIN),
        documents: [
          { group: 'A', label: 'Swedish passport', expiresOn: '2029-03-04' },
          {
            group: 'A',
            label: 'UK photocard driving licence',
            expiresOn: '2034-07-18',
          },
        ],
        checkedAt: at(-30 * HOUR - 40 * MIN),
        checkedBy: 'rev-marsh',
      },
      allocation: { ...invited, instructedAt: at(-5 * DAY + HOUR) },
      observations: [addrOk('o-132-1', 'The utility bill')],
      evidence: [
        {
          id: 'ev-132-1',
          kind: 'option2_document',
          label: 'Swedish passport, seen at the person check',
          uploadedAt: at(-30 * HOUR - 40 * MIN),
          note: 'Checked in person by a trained reviewer.',
        },
        {
          id: 'ev-132-2',
          kind: 'option2_document',
          label: 'UK photocard driving licence, seen at the person check',
          uploadedAt: at(-30 * HOUR - 40 * MIN),
          note: 'Checked in person by a trained reviewer.',
        },
        proof('ev-132-3', 'Utility bill', 'utility_bill', -31 * HOUR, 33),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -5 * DAY + 3 * HOUR,
        'PAY-2026-004132',
        {
          code: 'APC-FS-Z6C4',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
    },

    // Aidan Corrigan: NAME difference (AIDAN on the passport, AIDEN on the register). In review, Mandatory decision open.
    {
      id: 'EO-2026-000127',
      route: 'A',
      personId: 'p-aidan',
      companyNumber: '99630741',
      ...partnerBase('partner-meridian'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-7 * DAY),
      submittedForReviewAt: at(-5 * DAY),
      slaDueAt: at(-5 * DAY + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-5 * DAY - 2 * HOUR), 'IDV-7F31-1F88', 97.1),
        registerComparison: 'refer',
      },
      allocation: { ...invited, instructedAt: at(-7 * DAY + HOUR) },
      observations: [
        obs(
          'o-127-1',
          'register',
          'REG-11',
          'mismatch',
          'First name spelt differently on the register',
          'The name the individual entered is Aidan. The register holds Aiden. This is a spelling difference, not a difference of case, spacing, hyphen or apostrophe, so normalisation does not remove it. The case continues to your decision.',
          'Individual’s details, Companies House officer record',
        ),
        addrOk('o-127-2', 'The council tax bill'),
      ],
      evidence: [
        doc(
          'ev-127-1',
          'Irish passport, captured in the browser',
          -5 * DAY - 3 * HOUR,
        ),
        selfie('ev-127-2', -5 * DAY - 3 * HOUR),
        proof(
          'ev-127-3',
          'Council tax bill',
          'utility_bill',
          -5 * DAY - 2 * HOUR,
          48,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -7 * DAY + 4 * HOUR,
        'PAY-2026-004127',
        {
          code: 'APC-MG-3M8T',
          payerName: PARTNER_NAME['partner-meridian'],
        },
      ),
      correctionTaskId: 'FL-2026-000042',
      discrepancyReport: {
        summary: 'First name: AIDAN on the passport, AIDEN on the register.',
        promptedAt: at(-5 * DAY - 2 * HOUR + MIN),
      },
    },

    // Grace Whitaker: B2C, allocation confirmed by an administrator, possible PEP match
    {
      id: 'EO-2026-000134',
      route: 'A',
      personId: 'p-grace',
      companyNumber: '99712058',
      origin: 'b2c',
      source: 'b2c',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-1 * DAY),
      submittedForReviewAt: at(-5 * HOUR),
      slaDueAt: at(-5 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-5 * HOUR - 15 * MIN), 'IDV-7F31-2E40', 95.9),
        pepPossibleMatch: true,
        pepSanctionsDetail:
          'One possible PEP match by name: a former local councillor named Grace E. Whitaker. The record gives a year of birth of 1968 and no nationality. The provider has not discounted it.',
      },
      allocation: {
        source: 'administrator',
        suggestedAcspIds: ['acsp-harcourt', 'acsp-pellrowe'],
        confirmedBy: 'Marcus Adeyemi, Platform Administrator',
        confirmedAt: at(-1 * DAY + 8 * MIN),
        instructedAt: at(-1 * DAY + 14 * MIN),
      },
      observations: [
        regMatch('o-134-1', 'Grace'),
        addrOk('o-134-2', 'The bank statement'),
      ],
      evidence: [
        doc(
          'ev-134-1',
          'UK passport, captured in the browser',
          -5 * HOUR - 25 * MIN,
        ),
        selfie('ev-134-2', -5 * HOUR - 25 * MIN),
        proof(
          'ev-134-3',
          'Bank statement',
          'bank_statement',
          -5 * HOUR - 20 * MIN,
          12,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'pay_myself',
        -1 * DAY + 20 * MIN,
        'PAY-2026-004134',
      ),
    },

    // Anna Kovalenko: invite opened, journey not started. The live individual demo. Ukrainian passport, resident in the UAE.
    {
      id: 'EO-2026-000135',
      route: 'A',
      personId: 'p-anna',
      companyNumber: '99520316',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'invited',
      createdAt: at(-1 * DAY),
      idvt: pending,
      allocation: invited,
      observations: [],
      evidence: [],
    },

    // Imogen Reid: Harcourt Lane's own client. NATIONALITY difference: document Irish, register British.
    {
      id: 'EO-2026-000136',
      route: 'A',
      personId: 'p-imogen',
      companyNumber: '99804613',
      origin: 'acsp_invite',
      source: 'own_client',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-3 * DAY),
      submittedForReviewAt: at(-20 * HOUR),
      slaDueAt: at(-20 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-20 * HOUR - 10 * MIN), 'IDV-7F31-3A02', 97.4),
        registerComparison: 'refer',
      },
      allocation: { ...invited, instructedAt: at(-3 * DAY + HOUR) },
      observations: [
        obs(
          'o-136-1',
          'register',
          'REG-13',
          'mismatch',
          'Nationality differs from the register',
          'The nationality Imogen gave is Irish. The register holds British. The case continues to your decision.',
          'Individual’s details, Companies House officer record',
        ),
        addrOk('o-136-2', 'The utility bill'),
      ],
      evidence: [
        doc(
          'ev-136-1',
          'Irish passport, captured in the browser',
          -20 * HOUR - 20 * MIN,
        ),
        selfie('ev-136-2', -20 * HOUR - 20 * MIN),
        proof(
          'ev-136-3',
          'Utility bill',
          'utility_bill',
          -20 * HOUR - 15 * MIN,
          24,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'pay_myself',
        -3 * DAY + 2 * HOUR,
        'PAY-2026-004136',
      ),
      discrepancyReport: {
        summary:
          'Nationality: Irish on the passport and in the details given, British on the register.',
        promptedAt: at(-20 * HOUR - 9 * MIN),
      },
    },

    // Dmytro Shevchenko: TRANSLITERATION difference, Ukrainian passport, resident in the UAE
    {
      id: 'EO-2026-000137',
      route: 'A',
      personId: 'p-dmytro',
      companyNumber: '99927415',
      ...partnerBase('partner-meridian'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-4 * DAY),
      submittedForReviewAt: at(-18 * HOUR),
      slaDueAt: at(-18 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-18 * HOUR - 10 * MIN), 'IDV-7F31-3B18', 96.8),
        registerComparison: 'refer',
      },
      language: 'ru',
      allocation: { ...invited, instructedAt: at(-4 * DAY + HOUR) },
      observations: [
        obs(
          'o-137-1',
          'register',
          'REG-11',
          'mismatch',
          'First name transliterated differently on the register',
          'The name Dmytro gave is Dmytro. The register holds Dmitry, a different transliteration of the same Ukrainian name. Normalisation does not remove it. The case continues to your decision.',
          'Individual’s details, Companies House officer record',
        ),
        addrOk('o-137-2', 'The utility bill for the Dubai address'),
      ],
      evidence: [
        doc(
          'ev-137-1',
          'Ukrainian passport, captured in the browser',
          -18 * HOUR - 20 * MIN,
        ),
        selfie('ev-137-2', -18 * HOUR - 20 * MIN),
        proof(
          'ev-137-3',
          'Utility bill, Dubai address',
          'utility_bill',
          -18 * HOUR - 15 * MIN,
          37,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -4 * DAY + 5 * HOUR,
        'PAY-2026-004137',
        {
          code: 'APC-MG-7R4Q',
          payerName: PARTNER_NAME['partner-meridian'],
        },
      ),
      discrepancyReport: {
        summary:
          'First name: DMYTRO on the passport, DMITRY on the register (transliteration).',
        promptedAt: at(-18 * HOUR - 9 * MIN),
      },
    },

    // Hannah Pryce: passport expired two months ago. Not accepted (H1), so DOC-EXP-01 asks for another document. A Request, never a Halt.
    {
      id: 'EO-2026-000138',
      route: 'A',
      personId: 'p-hannah',
      companyNumber: '99915372',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_progress',
      createdAt: at(-2 * DAY),
      idvt: pending,
      allocation: { ...invited, instructedAt: at(-2 * DAY + HOUR) },
      journey: {
        emailConfirmed: true,
        mobileConfirmed: true,
        detailsConfirmed: true,
        personalConfirmed: true,
        instructedAt: at(-2 * DAY + HOUR),
        paid: true,
        documentType: 'passport',
        captureRoute: 'phone',
        photoPageDone: true,
        chipResult: 'read',
        selfieDone: true,
        livenessRoute: 'phone',
      },
      observations: [],
      evidence: [],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -2 * DAY + 3 * HOUR,
        'PAY-2026-004138',
        {
          code: 'APC-FS-Q8L3',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
    },

    // Joanna Pike: B2C mid-journey, suggested ACSPs ranked, waiting for an administrator to confirm
    {
      id: 'EO-2026-000139',
      route: 'A',
      personId: 'p-joanna',
      companyNumber: '99938164',
      origin: 'b2c',
      source: 'b2c',
      acspId: 'acsp-pellrowe',
      option: 1,
      status: 'in_progress',
      createdAt: at(-3 * HOUR),
      idvt: pending,
      journey: {
        emailConfirmed: true,
        mobileConfirmed: true,
        detailsConfirmed: true,
        personalConfirmed: true,
      },
      allocation: {
        source: 'suggested',
        suggestedAcspIds: ['acsp-pellrowe', 'acsp-harcourt', 'acsp-ashdown'],
      },
      observations: [],
      evidence: [],
    },

    // Matteo Ferrante: B2C client allocated to Ashdown Trust Services (Not yet listed, still allocatable), in progress. eVisa holder: the provider checks the eVisa with the Home Office, Option 1.
    {
      id: 'EO-2026-000140',
      route: 'A',
      personId: 'p-matteo',
      companyNumber: '99938164',
      origin: 'b2c',
      source: 'b2c',
      acspId: 'acsp-ashdown',
      option: 1,
      status: 'in_progress',
      createdAt: at(-1 * DAY - 2 * HOUR),
      idvt: pending,
      language: 'it',
      journey: {
        emailConfirmed: true,
        mobileConfirmed: true,
        detailsConfirmed: true,
        personalConfirmed: true,
        instructedAt: at(-1 * DAY),
        paid: true,
        documentType: 'passport',
        eVisa: true,
        captureRoute: 'phone',
      },
      allocation: {
        source: 'administrator',
        suggestedAcspIds: ['acsp-ashdown', 'acsp-harcourt'],
        confirmedBy: 'Marcus Adeyemi, Platform Administrator',
        confirmedAt: at(-1 * DAY - 40 * MIN),
        instructedAt: at(-1 * DAY),
      },
      observations: [],
      evidence: [],
      payment: pay(
        'acsp-ashdown',
        'pay_myself',
        -1 * DAY + 10 * MIN,
        'PAY-2026-004140',
      ),
    },

    // Owen Tregear: B2C client verified by the sole practitioner
    {
      id: 'EO-2026-000124',
      route: 'A',
      personId: 'p-owen',
      companyNumber: '99952087',
      origin: 'b2c',
      source: 'b2c',
      acspId: 'acsp-pellrowe',
      reviewerId: 'rev-pell',
      option: 1,
      status: 'confirmed',
      createdAt: at(-24 * DAY),
      submittedForReviewAt: at(-23 * DAY),
      slaDueAt: at(-23 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-23 * DAY - 2 * HOUR), 'IDV-7F31-0B66', 97.0),
      allocation: {
        source: 'administrator',
        suggestedAcspIds: ['acsp-pellrowe', 'acsp-harcourt'],
        confirmedBy: 'Marcus Adeyemi, Platform Administrator',
        confirmedAt: at(-24 * DAY + 20 * MIN),
        instructedAt: at(-24 * DAY + 30 * MIN),
      },
      observations: [regMatch('o-124-1', 'Owen')],
      evidence: [
        doc(
          'ev-124-1',
          'UK passport, captured in the browser',
          -23 * DAY - 3 * HOUR,
        ),
        selfie('ev-124-2', -23 * DAY - 3 * HOUR),
        proof(
          'ev-124-3',
          'Utility bill',
          'utility_bill',
          -23 * DAY - 2 * HOUR,
          30,
        ),
      ],
      payment: pay(
        'acsp-pellrowe',
        'pay_myself',
        -24 * DAY + HOUR,
        'PAY-2026-004124',
      ),
      decision: {
        outcome: 'approve',
        reasonCode: 'APR-01',
        decidedAt: at(-22 * DAY),
        reviewerId: 'rev-pell',
        stepUpRef: 'SU-4D9K-124A',
      },
      submission: {
        startedAt: at(-22 * DAY + HOUR),
        stepUpRef: 'SU-4D9K-124B',
        handedOffAt: at(-22 * DAY + 2 * HOUR),
        submittedAt: at(-22 * DAY + 2 * HOUR + 15 * MIN),
        confirmedAt: at(-22 * DAY + 3 * HOUR),
        verificationReference: 'CHV-2026-4RT9WB',
        referenceSource: 'entered',
      },
      personalCodeReceipt: {
        askedAt: at(-21 * DAY + 3 * HOUR),
        answer: 'yes',
        answeredAt: at(-21 * DAY + 6 * HOUR),
      },
    },

    // Bernard Whitlow: Fenwick & Shaw's own client, verified by Fenwick & Shaw as an ACSP. £49, no platform fee.
    {
      id: 'EO-2026-000126',
      route: 'A',
      personId: 'p-bernard',
      companyNumber: '99418027',
      origin: 'acsp_invite',
      source: 'own_client',
      acspId: 'acsp-fenwick',
      reviewerId: 'rev-shaw',
      option: 1,
      status: 'confirmed',
      createdAt: at(-15 * DAY),
      submittedForReviewAt: at(-14 * DAY),
      slaDueAt: at(-14 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-14 * DAY - 2 * HOUR), 'IDV-7F31-0C71', 96.5),
      allocation: { ...invited, instructedAt: at(-15 * DAY + HOUR) },
      observations: [regMatch('o-126-1', 'Bernard')],
      evidence: [
        doc(
          'ev-126-1',
          'UK passport, captured in the browser',
          -14 * DAY - 3 * HOUR,
        ),
        selfie('ev-126-2', -14 * DAY - 3 * HOUR),
        proof(
          'ev-126-3',
          'Bank statement',
          'bank_statement',
          -14 * DAY - 2 * HOUR,
          9,
        ),
      ],
      payment: pay(
        'acsp-fenwick',
        'pay_myself',
        -15 * DAY + 2 * HOUR,
        'PAY-2026-004126',
      ),
      decision: {
        outcome: 'approve',
        reasonCode: 'APR-01',
        decidedAt: at(-13 * DAY),
        reviewerId: 'rev-shaw',
        stepUpRef: 'SU-2H6P-126A',
      },
      submission: {
        startedAt: at(-13 * DAY + HOUR),
        stepUpRef: 'SU-2H6P-126B',
        handedOffAt: at(-13 * DAY + 2 * HOUR),
        submittedAt: at(-13 * DAY + 2 * HOUR + 25 * MIN),
        confirmedAt: at(-13 * DAY + 4 * HOUR),
        verificationReference: 'CHV-2026-9XP3LD',
        referenceSource: 'forwarded_email',
      },
      personalCodeReceipt: { askedAt: at(-12 * DAY + 4 * HOUR) },
    },

    // Northbank Compliance (suspended): three cases it verified earlier, the ACSP-12 list
    ...(
      [
        [
          'EO-2026-000071',
          'p-rhys',
          -128,
          'CHV-2026-2NB7QA',
          'PAY-2026-004071',
          'IDV-6C20-0A11',
        ],
        [
          'EO-2026-000084',
          'p-eleni',
          -103,
          'CHV-2026-8MC4ZT',
          'PAY-2026-004084',
          'IDV-6C20-0B24',
        ],
        [
          'EO-2026-000097',
          'p-gareth',
          -66,
          'CHV-2026-5KD1RV',
          'PAY-2026-004097',
          'IDV-6C20-0C37',
        ],
      ] as const
    ).map(([id, personId, d, chv, payRef, idvRef]): VerificationCase => {
      const n = id.slice(-6)
      const isLicence = personId === 'p-eleni'
      // Gareth was referred by Fenwick & Shaw, so the Partner is notified of him (ACSP-12, M3).
      const referred = personId === 'p-gareth'
      return {
        id,
        route: 'A',
        personId,
        companyNumber: '99941526',
        ...(referred
          ? partnerBase('partner-fenwick')
          : { origin: 'b2c' as const, source: 'b2c' as const }),
        acspId: 'acsp-northbank',
        reviewerId: 'rev-basu',
        option: 1,
        status: 'confirmed',
        createdAt: at(d * DAY),
        submittedForReviewAt: at(d * DAY + DAY),
        slaDueAt: at(d * DAY + DAY + SLA_HOURS * HOUR),
        idvt: passAll(at(d * DAY + DAY - 2 * HOUR), idvRef, 96.3),
        allocation: {
          source: 'administrator',
          suggestedAcspIds: ['acsp-northbank', 'acsp-pellrowe'],
          confirmedBy: 'Marcus Adeyemi, Platform Administrator',
          confirmedAt: at(d * DAY + 15 * MIN),
          instructedAt: at(d * DAY + 25 * MIN),
        },
        observations: [],
        evidence: [
          doc(
            `ev-${n}-1`,
            isLicence
              ? 'UK photocard driving licence, captured in the browser'
              : 'UK passport, captured in the browser',
            d * DAY + DAY - 3 * HOUR,
          ),
          selfie(`ev-${n}-2`, d * DAY + DAY - 3 * HOUR),
          proof(
            `ev-${n}-3`,
            'Bank statement',
            'bank_statement',
            d * DAY + DAY - 2 * HOUR,
            14,
          ),
        ],
        payment: pay('acsp-northbank', 'pay_myself', d * DAY + HOUR, payRef),
        decision: {
          outcome: 'approve',
          reasonCode: 'APR-01',
          decidedAt: at(d * DAY + 2 * DAY),
          reviewerId: 'rev-basu',
          stepUpRef: `SU-${n.slice(-4)}-NB1A`,
        },
        submission: {
          startedAt: at(d * DAY + 2 * DAY + HOUR),
          stepUpRef: `SU-${n.slice(-4)}-NB1B`,
          handedOffAt: at(d * DAY + 2 * DAY + 2 * HOUR),
          submittedAt: at(d * DAY + 2 * DAY + 2 * HOUR + 18 * MIN),
          confirmedAt: at(d * DAY + 2 * DAY + 4 * HOUR),
          verificationReference: chv,
          referenceSource: 'entered',
        },
        personalCodeReceipt: {
          askedAt: at(d * DAY + 3 * DAY + 4 * HOUR),
          answer: 'yes',
          answeredAt: at(d * DAY + 3 * DAY + 7 * HOUR),
        },
      }
    }),

    // Northbank: open case referred by Fenwick & Shaw, offered to Pell with the individual's agreement (pending)
    {
      id: 'EO-2026-000120',
      route: 'A',
      personId: 'p-ruth',
      companyNumber: '99941526',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-northbank',
      option: 1,
      status: 'in_review',
      createdAt: at(-9 * DAY),
      submittedForReviewAt: at(-30 * HOUR),
      slaDueAt: at(-30 * HOUR + SLA_HOURS * HOUR),
      idvt: passAll(at(-30 * HOUR - 15 * MIN), 'IDV-6C20-0D48', 96.0),
      allocation: { ...invited, instructedAt: at(-9 * DAY + 25 * MIN) },
      observations: [],
      evidence: [
        doc(
          'ev-120-1',
          'UK photocard driving licence, captured in the browser',
          -30 * HOUR - 25 * MIN,
        ),
        selfie('ev-120-2', -30 * HOUR - 25 * MIN),
        proof(
          'ev-120-3',
          'Utility bill',
          'utility_bill',
          -30 * HOUR - 20 * MIN,
          21,
        ),
      ],
      payment: pay(
        'acsp-northbank',
        'pay_myself',
        -9 * DAY + HOUR,
        'PAY-2026-004120',
      ),
      reallocation: {
        fromAcspId: 'acsp-northbank',
        offeredAcspId: 'acsp-pellrowe',
        offeredAt: at(-7 * DAY),
        individualResponse: 'pending',
      },
    },

    // Northbank: open case, the individual declined the offer
    {
      id: 'EO-2026-000122',
      route: 'A',
      personId: 'p-callum',
      companyNumber: '99941526',
      origin: 'b2c',
      source: 'b2c',
      acspId: 'acsp-northbank',
      option: 1,
      status: 'in_progress',
      createdAt: at(-8 * DAY),
      idvt: pending,
      journey: {
        emailConfirmed: true,
        mobileConfirmed: true,
        detailsConfirmed: true,
        personalConfirmed: true,
        instructedAt: at(-8 * DAY + 30 * MIN),
        paid: true,
      },
      allocation: {
        source: 'administrator',
        suggestedAcspIds: ['acsp-northbank', 'acsp-pellrowe'],
        confirmedBy: 'Marcus Adeyemi, Platform Administrator',
        confirmedAt: at(-8 * DAY + 15 * MIN),
        instructedAt: at(-8 * DAY + 30 * MIN),
      },
      observations: [],
      evidence: [],
      payment: pay(
        'acsp-northbank',
        'pay_myself',
        -8 * DAY + HOUR,
        'PAY-2026-004122',
      ),
      reallocation: {
        fromAcspId: 'acsp-northbank',
        offeredAcspId: 'acsp-ashdown',
        offeredAt: at(-7 * DAY),
        individualResponse: 'declined',
        respondedAt: at(-6 * DAY - 3 * HOUR),
      },
    },

    // Marcus Hale: verified last year, reverification now due
    {
      id: 'EO-2025-000061',
      route: 'A',
      personId: 'p-marcus',
      companyNumber: '99520316',
      ...partnerBase('partner-fenwick'),
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-okoro',
      option: 1,
      status: 'confirmed',
      createdAt: at(-352 * DAY),
      submittedForReviewAt: at(-351 * DAY),
      slaDueAt: at(-351 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-351 * DAY - HOUR), 'IDV-5B02-0E19', 96.9),
      allocation: { ...invited, instructedAt: at(-352 * DAY + HOUR) },
      observations: [],
      evidence: [
        doc(
          'ev-61-1',
          'UK passport, captured in the browser',
          -351 * DAY - 2 * HOUR,
        ),
        proof(
          'ev-61-2',
          'Bank statement',
          'bank_statement',
          -351 * DAY - HOUR,
          20,
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -352 * DAY + 3 * HOUR,
        'PAY-2025-002061',
        {
          code: 'APC-FS-B3L7',
          payerName: PARTNER_NAME['partner-fenwick'],
        },
      ),
      decision: {
        outcome: 'approve',
        reasonCode: 'APR-01',
        decidedAt: at(-350 * DAY),
        reviewerId: 'rev-okoro',
        stepUpRef: 'SU-3V8T-061A',
      },
      submission: {
        startedAt: at(-350 * DAY + HOUR),
        stepUpRef: 'SU-3V8T-061B',
        handedOffAt: at(-350 * DAY + HOUR),
        submittedAt: at(-350 * DAY + 2 * HOUR),
        confirmedAt: at(-350 * DAY + 3 * HOUR),
        verificationReference: 'CHV-2025-P3V8TN',
        referenceSource: 'entered',
      },
    },

    // Fiona Corrigan: started and abandoned. Kept for 7 years like any other record.
    {
      id: 'EO-2026-000102',
      route: 'A',
      personId: 'p-fiona',
      companyNumber: '99630741',
      ...partnerBase('partner-meridian'),
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'abandoned',
      createdAt: at(-76 * DAY),
      idvt: pending,
      allocation: invited,
      observations: [],
      evidence: [],
      closedAt: at(-46 * DAY),
    },

    // Nadia Kerr: declined last year. Passport expired beyond the permitted period.
    {
      id: 'EO-2025-000088',
      route: 'A',
      personId: 'p-nadia',
      companyNumber: '99630741',
      ...partnerBase('partner-meridian'),
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-okoro',
      option: 1,
      status: 'declined',
      createdAt: at(-330 * DAY),
      submittedForReviewAt: at(-328 * DAY),
      slaDueAt: at(-328 * DAY + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-328 * DAY - HOUR), 'IDV-5B02-0F77', 94.2),
        documentAuthenticity: 'refer',
      },
      allocation: { ...invited, instructedAt: at(-330 * DAY + HOUR) },
      observations: [],
      evidence: [
        doc(
          'ev-88-1',
          'UK passport, captured in the browser',
          -328 * DAY - 2 * HOUR,
          'Provider returned the authenticity check for review.',
        ),
      ],
      payment: pay(
        'acsp-harcourt',
        'agent_payment_code',
        -330 * DAY + 3 * HOUR,
        'PAY-2025-002088',
        {
          code: 'APC-MG-W9N2',
          payerName: PARTNER_NAME['partner-meridian'],
        },
      ),
      decision: {
        outcome: 'decline',
        reasonCode: 'DCL-01',
        note: 'Passport expired beyond the permitted period and no other qualifying identity document was provided after the request.',
        decidedAt: at(-327 * DAY),
        reviewerId: 'rev-okoro',
        stepUpRef: 'SU-9F2D-088A',
      },
    },
  ]

  const numbered = assignClientInvoiceIds(cases.map(settle))

  const corrections: CorrectionTask[] = [
    {
      id: 'FL-2026-000042',
      route: 'B',
      form: 'ACSP04',
      caseId: 'EO-2026-000127',
      companyNumber: '99630741',
      personId: 'p-aidan',
      field: 'First name',
      registerValue: 'Aiden',
      correctValue: 'Aidan',
      status: 'open',
      createdAt: at(-5 * DAY + 3 * HOUR),
    },
  ]

  // Invites from Referral Partners, each with a single-use Agent Payment Code tied to one invite.
  const inviteRows: [
    string,
    string,
    string,
    string,
    string,
    number,
    boolean,
  ][] = [
    // id, personId, caseId, partnerId, code, sent offset (days), used
    [
      'INV-2026-000301',
      'p-margaret',
      'EO-2026-000118',
      'partner-fenwick',
      'APC-FS-K2M8',
      -42,
      true,
    ],
    [
      'INV-2026-000302',
      'p-thomas',
      'EO-2026-000129',
      'partner-fenwick',
      'APC-FS-R7T3',
      -7,
      true,
    ],
    [
      'INV-2026-000305',
      'p-lucy',
      'EO-2026-000133',
      'partner-fenwick',
      'APC-FS-D8P2',
      -4,
      true,
    ],
    [
      'INV-2026-000316',
      'p-sofia',
      'EO-2026-000132',
      'partner-fenwick',
      'APC-FS-Z6C4',
      -6,
      true,
    ],
    [
      'INV-2026-000317',
      'p-priya',
      'EO-2026-000131',
      'partner-fenwick',
      'APC-FS-H5W9',
      -3,
      true,
    ],
    [
      'INV-2026-000318',
      'p-anna',
      'EO-2026-000135',
      'partner-fenwick',
      'APC-FS-N4X6',
      -1,
      false,
    ],
    [
      'INV-2026-000320',
      'p-hannah',
      'EO-2026-000138',
      'partner-fenwick',
      'APC-FS-Q8L3',
      -3,
      true,
    ],
    [
      'INV-2026-000288',
      'p-aidan',
      'EO-2026-000127',
      'partner-meridian',
      'APC-MG-3M8T',
      -8,
      true,
    ],
    [
      'INV-2026-000312',
      'p-dmytro',
      'EO-2026-000137',
      'partner-meridian',
      'APC-MG-7R4Q',
      -5,
      true,
    ],
    [
      'INV-2026-000254',
      'p-fiona',
      'EO-2026-000102',
      'partner-meridian',
      'APC-MG-V2J5',
      -77,
      false,
    ],
    [
      'INV-2025-000211',
      'p-nadia',
      'EO-2025-000088',
      'partner-meridian',
      'APC-MG-W9N2',
      -331,
      true,
    ],
    [
      'INV-2025-000209',
      'p-marcus',
      'EO-2025-000061',
      'partner-fenwick',
      'APC-FS-B3L7',
      -353,
      true,
    ],
  ]
  const invites: Invite[] = inviteRows.map(
    ([id, personId, caseId, partnerId, code, d, used]) => {
      const c = numbered.find((x) => x.id === caseId)!
      return {
        id,
        personId,
        companyNumber: c.companyNumber,
        partnerId,
        sentAt: at(d * DAY),
        paymentCode: code,
        paymentCodeUsedAt: used ? c.payment?.paidAt : undefined,
        status:
          caseId === 'EO-2026-000135'
            ? 'opened'
            : caseId === 'EO-2026-000102'
              ? 'expired'
              : 'accepted',
        caseId,
        instructingAcspId: 'acsp-harcourt',
        payer: 'partner',
      }
    },
  )

  // ---- Audit entries. Each case's events land in the chain of the ACSP that held it. ----
  const audit: AuditInput[] = []
  const ev = (
    offset: number,
    actor: string,
    actorType: AuditInput['actorType'],
    action: string,
    caseId: string,
    detail: string,
  ) => audit.push({ at: at(offset), actor, actorType, action, caseId, detail })
  const offsetOf = (iso: string) => new Date(iso).getTime() - now
  const money = (n: number) => `£${n.toFixed(2)}`

  for (const c of numbered) {
    const name = personName(c.personId)
    const acspName = ACSP_NAME[c.acspId]
    const inv = invites.find((i) => i.caseId === c.id)
    const reviewer = c.reviewerId ? REVIEWER_NAME[c.reviewerId] : undefined

    if (inv && c.partnerId) {
      ev(
        offsetOf(inv.sentAt),
        PARTNER_ACTOR[c.partnerId],
        'person',
        'invite.sent',
        c.id,
        `Invite ${inv.id} sent to ${name}, pre-filled from the register. Instructing ACSP: ${acspName}. Single-use Agent Payment Code ${inv.paymentCode}, paid by the Referral Partner.`,
      )
    }
    if (c.origin === 'acsp_invite') {
      ev(
        offsetOf(c.createdAt),
        reviewer ?? 'Eleanor Marsh, Harcourt Lane',
        'person',
        'invite.sent',
        c.id,
        `Invite sent by ${acspName} to its own client ${name}. No platform fee applies: included in the ACSP's subscription.`,
      )
    }
    if (c.origin === 'b2c' && c.allocation) {
      ev(
        offsetOf(c.createdAt),
        name,
        'person',
        'b2c.started',
        c.id,
        `${name} started a verification directly. Suggested ACSPs ranked by clear criteria, not AI.`,
      )
      if (c.allocation.confirmedAt)
        ev(
          offsetOf(c.allocation.confirmedAt),
          c.allocation.confirmedBy ?? 'Platform Administrator',
          'person',
          'b2c.allocated',
          c.id,
          `Allocation to ${acspName} confirmed by an administrator.`,
        )
    }
    if (c.payment) {
      const p = c.payment
      ev(
        offsetOf(p.authorisedAt),
        name,
        'person',
        'payment.authorised',
        c.id,
        p.method === 'agent_payment_code'
          ? `${name} instructed ${acspName}. ${money(p.amount)} authorised, paid by ${p.payerName} on their behalf with Agent Payment Code ${p.code}. Taken only on approval.`
          : `${name} instructed ${acspName}. Card authorised for ${money(p.amount)} through the secure payment provider. Nothing is taken until ${acspName} approves.`,
      )
    }
    if (c.idvt.completedAt) {
      const extra = c.idvt.pepPossibleMatch
        ? ' Screening returned one possible PEP match.'
        : c.idvt.liveness === 'fail'
          ? ' Liveness not passed on attempt 3 of 3.'
          : ' PEP and sanctions: no match.'
      ev(
        offsetOf(c.idvt.completedAt),
        PROVIDER,
        'system',
        'idvt.result.received',
        c.id,
        c.idvt.liveness === 'fail'
          ? `Document authenticity passed.${extra}`
          : `Document authenticity, liveness and face match ${c.idvt.faceMatchScore}% passed.${extra}`,
      )
      if (c.idvt.pepPossibleMatch)
        ev(
          offsetOf(c.idvt.completedAt) + MIN,
          RULES,
          'system',
          'rules.mandatory',
          c.id,
          'AML-02: possible PEP match. Mandatory decision for the reviewer.',
        )
    }
    if (c.discrepancyReport) {
      ev(
        offsetOf(c.discrepancyReport.promptedAt) - MIN,
        RULES,
        'system',
        'rules.mandatory',
        c.id,
        `Register difference flagged, not halted: ${c.discrepancyReport.summary} Mandatory decision for the reviewer.`,
      )
      ev(
        offsetOf(c.discrepancyReport.promptedAt),
        SYSTEM,
        'system',
        'case.discrepancy.prompted',
        c.id,
        'Reviewer prompted to report the difference to Companies House. The prompt and the choice are logged on the case. Filing through an API is not in scope.',
      )
    }
    for (const o of c.observations.filter((x) => x.severity !== 'info'))
      ev(
        offsetOf(c.submittedForReviewAt ?? c.createdAt) + 2 * MIN,
        AI,
        'ai',
        'ai.observation.created',
        c.id,
        `AI observation on ${o.ruleId}: ${o.title}. Advisory only.`,
      )
    for (const m of c.messages ?? []) {
      if (m.kind !== 'code') {
        ev(
          offsetOf(m.at),
          m.authorName,
          'person',
          'case.message.sent',
          c.id,
          `Secure message sent ${m.from === 'reviewer' ? 'to the individual' : 'to the ACSP reviewer'}. An email notification was sent. The message text stays in the case thread.`,
        )
        continue
      }
      // Code messages: sent, viewed and received are recorded, never the code.
      const kind =
        m.codeKind === 'company_authentication_code'
          ? 'company authentication code'
          : 'personal code'
      ev(
        offsetOf(m.at),
        m.authorName,
        'person',
        'case.code_message.sent',
        c.id,
        `Code message sent to the allocated ACSP reviewer (${kind}). Only the allocated reviewer and the individual can open it. The code is not recorded in the audit trail.`,
      )
      if (m.receivedAt && m.receivedBy) {
        ev(
          offsetOf(m.receivedAt) - 2 * MIN,
          m.receivedBy,
          'person',
          'case.code_message.viewed',
          c.id,
          `The allocated ACSP reviewer opened a code message (${kind}). The code is not recorded in the audit trail.`,
        )
        ev(
          offsetOf(m.receivedAt),
          m.receivedBy,
          'person',
          'case.code_message.received',
          c.id,
          `The ACSP marked the code received. The message text will be deleted automatically on ${(m.deleteOn ?? '').slice(0, 10)}, 30 days later. The code is not recorded in the audit trail.`,
        )
      }
    }
    if (c.decision && reviewer) {
      if (c.decision.stepUpRef)
        ev(
          offsetOf(c.decision.decidedAt) - MIN,
          reviewer,
          'person',
          'auth.stepup.succeeded',
          c.id,
          `Step-up ${c.decision.stepUpRef} confirmed by passkey before the decision.`,
        )
      ev(
        offsetOf(c.decision.decidedAt),
        reviewer,
        'person',
        `case.decision.${c.decision.outcome}`,
        c.id,
        c.decision.outcome === 'approve'
          ? `Approved. Reason ${c.decision.reasonCode}. Retention of 7 years starts from this decision.`
          : c.decision.outcome === 'request_info'
            ? `More information requested. Reason ${c.decision.reasonCode}: one proof of current address dated within six months.`
            : `Declined. Reason ${c.decision.reasonCode}. Retention of 7 years starts from this decision.`,
      )
    }
    if (c.payment?.status === 'taken') {
      const p = c.payment
      const fee =
        (p.platformFee ?? 0) > 0
          ? `Platform fee ${money(p.platformFee!)} plus VAT ${money(p.platformFeeVat ?? 0)} deducted automatically.`
          : 'No platform fee: the ACSP’s own client.'
      ev(
        offsetOf(p.paidAt!) + 1000,
        SYSTEM,
        'system',
        'payment.taken',
        c.id,
        `Approved, so ${money(p.amount)} was taken ${p.method === 'agent_payment_code' ? `from ${p.payerName}, paid on the client's behalf` : `from ${name}'s card`}. Evidence One collected it as ${acspName}'s disclosed agent. ${fee} Net ${money(p.netPayout ?? 0)} to the ACSP's own payment account. Invoice ${p.clientInvoiceId} issued in ${acspName}'s name.`,
      )
    }
    if (c.payment?.status === 'released') {
      const p = c.payment
      ev(
        offsetOf(p.releasedAt!) + 1000,
        SYSTEM,
        'system',
        'payment.released',
        c.id,
        `${p.releaseReason}. The authorisation of ${money(p.amount)} was released. Nothing was taken and no invoice was issued.`,
      )
    }
    const s = c.submission
    if (s && reviewer) {
      if (s.startedAt)
        ev(
          offsetOf(s.startedAt),
          reviewer,
          'person',
          'submission.started',
          c.id,
          `Submission workspace started. Step-up ${s.stepUpRef} confirmed by passkey.`,
        )
      if (s.handedOffAt)
        ev(
          offsetOf(s.handedOffAt),
          reviewer,
          'person',
          'submission.handoff',
          c.id,
          `Continued to the ACSP's own One Login and the Companies House service with the submission pack.`,
        )
      if (s.submittedAt)
        ev(
          offsetOf(s.submittedAt),
          reviewer,
          'person',
          'submission.submitted',
          c.id,
          'Returned from the Companies House service. Submission made.',
        )
      if (s.confirmedAt)
        ev(
          offsetOf(s.confirmedAt),
          reviewer,
          'person',
          'submission.confirmed',
          c.id,
          `Verification reference ${s.verificationReference} recorded${s.referenceSource === 'forwarded_email' ? ' from the forwarded confirmation email' : ''}. Companies House will email the personal code directly to ${name}. Evidence One does not receive or keep it.`,
        )
    }
    if (c.personalCodeReceipt)
      ev(
        offsetOf(c.personalCodeReceipt.askedAt),
        SYSTEM,
        'system',
        'personal_code.receipt_asked',
        c.id,
        `${name} asked to confirm that the code has arrived from Companies House.${c.personalCodeReceipt.answer ? ` Answer: ${c.personalCodeReceipt.answer === 'yes' ? 'yes' : 'not yet'}.` : ''}`,
      )
    if (c.reallocation) {
      const r = c.reallocation
      ev(
        offsetOf(r.offeredAt),
        SYSTEM,
        'system',
        'case.reallocation.offered',
        c.id,
        `${ACSP_NAME[r.fromAcspId]} is suspended (ACSP-13). The case was offered to ${ACSP_NAME[r.offeredAcspId]}, with ${name}'s agreement required.`,
      )
      if (r.respondedAt)
        ev(
          offsetOf(r.respondedAt),
          name,
          'person',
          'case.reallocation.declined',
          c.id,
          `${name} declined the offer. The case stays paused until an administrator offers another ACSP.`,
        )
    }
  }

  // Case-specific entries that the generic pass cannot derive.
  ev(
    -5 * DAY + 3 * HOUR,
    REVIEWER_NAME['rev-marsh'],
    'person',
    'route_b.task.created',
    'EO-2026-000127',
    'Route B correction task FL-2026-000042 (ACSP04) created for the register. Route A continues in review.',
  )
  ev(
    -9 * HOUR + 3 * MIN,
    RULES,
    'system',
    'rules.request',
    'EO-2026-000138',
    'DOC-EXP-01: the passport expired two months ago. An expired passport is not accepted, so another document was asked for. A Request, never a Halt.',
  )
  ev(
    -14 * HOUR + MIN,
    RULES,
    'system',
    'rules.evaluated',
    'EO-2026-000131',
    'IDVT-01: the passport has a chip and no chip was read in the identity provider’s chip reader. The case continues and records that no chip was read. Flagged with a Mandatory decision for the reviewer.',
  )
  ev(
    -4 * DAY - 3 * HOUR + MIN,
    RULES,
    'system',
    'rules.request',
    'EO-2026-000129',
    'ADDL-11: the proof of address is older than six months. A more recent one was requested.',
  )
  ev(
    -26 * HOUR - 14 * MIN,
    RULES,
    'system',
    'rules.request',
    'EO-2026-000133',
    'ADDL-03: a former name was declared. One supporting document requested, and supplied.',
  )
  ev(
    -4 * DAY + 10 * MIN,
    RULES,
    'system',
    'rules.option2',
    'EO-2026-000132',
    'IDVT-08: all attempts used. Option 2 offered under OPT-02.',
  )
  ev(
    -30 * HOUR - 40 * MIN,
    REVIEWER_NAME['rev-marsh'],
    'person',
    'option2.check_recorded',
    'EO-2026-000132',
    'Person check recorded: Swedish passport and UK photocard driving licence (two from Group A). Training attestation TA-2026-0187.',
  )
  ev(
    -64 * DAY,
    SYSTEM,
    'system',
    'invite.reminder',
    'EO-2026-000102',
    'Reminders sent after 2, 5 and 10 days.',
  )
  ev(
    -46 * DAY,
    SYSTEM,
    'system',
    'case.abandoned',
    'EO-2026-000102',
    'No activity for 30 days. Case closed as abandoned. Record retained for 7 years from closure (RET-02).',
  )
  ev(
    -1 * DAY + 5 * MIN,
    SYSTEM,
    'system',
    'b2c.suggested',
    'EO-2026-000134',
    'Two ACSPs suggested from the onboarding answers, each with its own fee and turnaround. Ranked by clear criteria. Not AI.',
  )
  ev(
    -3 * HOUR + 5 * MIN,
    SYSTEM,
    'system',
    'b2c.suggested',
    'EO-2026-000139',
    'Three ACSPs suggested, ranked by clear criteria. Not AI. Awaiting administrator confirmation.',
  )
  ev(
    -20 * HOUR,
    'Anna Kovalenko',
    'person',
    'invite.opened',
    'EO-2026-000135',
    'Invite link opened in the browser. Journey not started.',
  )

  return { cases: numbered, corrections, invites, audit }
}
