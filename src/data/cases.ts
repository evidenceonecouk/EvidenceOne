import type { AuditInput } from '@/lib/audit'
import { SLA_HOURS, VERIFICATION_FEE } from '@/lib/format'
import type { CorrectionTask, IdvtResults, Invite, VerificationCase } from '@/types/domain'

/*
  Cases in mixed statuses. Timestamps are relative to the moment the demo is
  seeded, so SLA countdowns are always live when a presenter opens the demo.
*/

const HOUR = 3_600_000
const DAY = 24 * HOUR

const passAll = (at: string, ref: string, score: number): IdvtResults => ({
  nfcChipRead: 'pass',
  documentAuthenticity: 'pass',
  liveness: 'pass',
  faceMatch: 'pass',
  faceMatchScore: score,
  pepSanctions: 'pass',
  pepSanctionsDetail: 'No match on PEP, sanctions or adverse media lists.',
  completedAt: at,
  providerReference: ref,
})

const pending: IdvtResults = {
  nfcChipRead: 'pending',
  documentAuthenticity: 'pending',
  liveness: 'pending',
  faceMatch: 'pending',
  pepSanctions: 'pending',
}

export function buildCases(now: number) {
  const at = (offsetMs: number) => new Date(now + offsetMs).toISOString()
  const fee = VERIFICATION_FEE

  const cases: VerificationCase[] = [
    // Margaret Ashby: verified, submitted to Companies House, personal code recorded
    {
      id: 'EO-2026-000118',
      route: 'A',
      personId: 'p-margaret',
      companyNumber: '99418027',
      origin: 'agent_invite',
      agentId: 'agent-fenwick',
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-marsh',
      option: 1,
      status: 'submitted',
      createdAt: at(-41 * DAY),
      submittedForReviewAt: at(-40 * DAY),
      slaDueAt: at(-40 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-40 * DAY - 2 * HOUR), 'IDV-7F31-0A92', 97.8),
      comparison: [
        { field: 'Full name', stated: 'Margaret Ellen Ashby', document: 'MARGARET ELLEN ASHBY', register: 'ASHBY, Margaret Ellen', result: 'match' },
        { field: 'Date of birth', stated: '22 May 1961', document: '22 May 1961', register: 'May 1961', result: 'match', note: 'The public register shows month and year only.' },
        { field: 'Appointment', stated: 'Director and PSC', document: 'Not shown', register: 'Director and PSC since 6 April 2011', result: 'match' },
      ],
      observations: [
        { id: 'o-118-1', severity: 'info', title: 'All details match the register', detail: 'Name, date of birth and appointment agree across the application, the passport chip and the Companies House register.', source: 'Passport chip data, Companies House officer and PSC records' },
      ],
      evidence: [
        { id: 'ev-118-1', kind: 'identity_document', label: 'UK passport, chip read in app', uploadedAt: at(-40 * DAY - 3 * HOUR), aiCheck: 'accepted', aiNote: 'Document in date. Chip signature validated by the certified identity provider.' },
        { id: 'ev-118-2', kind: 'selfie', label: 'Liveness capture', uploadedAt: at(-40 * DAY - 3 * HOUR), aiCheck: 'accepted' },
      ],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-FS-7Q4K', paidAt: at(-40 * DAY - 4 * HOUR), reference: 'PAY-2026-004118' },
      decision: { outcome: 'approve', reasonCode: 'APR-01', note: 'All checks passed. Identity verified to the required standard.', decidedAt: at(-39 * DAY), reviewerId: 'rev-marsh' },
      submission: { handedOffAt: at(-39 * DAY + 2 * HOUR), submittedAt: at(-39 * DAY + 3 * HOUR), personalCode: 'K7Q2M9XR4LT' },
    },

    // Thomas Ashby: AI asked for supporting address evidence; reviewer requested more information
    {
      id: 'EO-2026-000129',
      route: 'A',
      personId: 'p-thomas',
      companyNumber: '99418027',
      origin: 'agent_invite',
      agentId: 'agent-fenwick',
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-marsh',
      option: 1,
      status: 'info_requested',
      createdAt: at(-6 * DAY),
      submittedForReviewAt: at(-4 * DAY),
      slaDueAt: at(-4 * DAY + SLA_HOURS * HOUR),
      idvt: { ...passAll(at(-4 * DAY - 3 * HOUR), 'IDV-7F31-1C04', 96.4), nfcChipRead: 'not_applicable' },
      comparison: [
        { field: 'Full name', stated: 'Thomas James Ashby', document: 'THOMAS JAMES ASHBY', register: 'ASHBY, Thomas James', result: 'match' },
        { field: 'Date of birth', stated: '3 August 1989', document: '3 August 1989', register: 'August 1989', result: 'match' },
        { field: 'Current address', stated: 'Flat 2, 9 Broad Street, Shrewsbury', document: 'The Old Granary, Ludlow', register: 'Not compared', result: 'not_compared', note: 'Moved four months ago. The licence shows the previous address.' },
      ],
      observations: [
        { id: 'o-129-1', severity: 'attention', title: 'Identity document does not confirm the 12-month address history', detail: 'The driving licence shows the previous Ludlow address. Supporting evidence of the current Shrewsbury address was requested automatically.', source: 'Driving licence, address panel' },
        { id: 'o-129-2', severity: 'attention', title: 'Supporting evidence is older than 3 months', detail: 'The council tax bill uploaded is dated more than three months ago, so it may not meet the requirement for current-address evidence.', source: 'Council tax bill, issue date' },
      ],
      evidence: [
        { id: 'ev-129-1', kind: 'identity_document', label: 'UK photocard driving licence', uploadedAt: at(-4 * DAY - 4 * HOUR), aiCheck: 'accepted', aiNote: 'Document in date. Security features validated by the certified identity provider.' },
        { id: 'ev-129-2', kind: 'selfie', label: 'Liveness capture', uploadedAt: at(-4 * DAY - 4 * HOUR), aiCheck: 'accepted' },
        { id: 'ev-129-3', kind: 'address_evidence', label: 'Council tax bill', uploadedAt: at(-4 * DAY - 2 * HOUR), documentDate: at(-150 * DAY), aiCheck: 'flagged', aiNote: 'Dated about five months ago. Current-address evidence must be dated within the last 3 months.' },
      ],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-FS-7Q4K', paidAt: at(-4 * DAY - 5 * HOUR), reference: 'PAY-2026-004129' },
      decision: { outcome: 'request_info', reasonCode: 'RFI-02', note: 'Please upload a bank statement or utility bill for the Shrewsbury address, dated within the last 3 months.', decidedAt: at(-2 * DAY), reviewerId: 'rev-marsh' },
    },

    // Priya Raman: clean case waiting for review, about 22 hours left on the SLA
    {
      id: 'EO-2026-000131',
      route: 'A',
      personId: 'p-priya',
      companyNumber: '99520316',
      origin: 'agent_invite',
      agentId: 'agent-fenwick',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-2 * DAY),
      submittedForReviewAt: at(-14 * HOUR),
      slaDueAt: at(-14 * HOUR + SLA_HOURS * HOUR),
      idvt: passAll(at(-14 * HOUR - 20 * 60000), 'IDV-7F31-2D17', 98.6),
      comparison: [
        { field: 'Full name', stated: 'Priya Lakshmi Raman', document: 'PRIYA LAKSHMI RAMAN', register: 'RAMAN, Priya Lakshmi', result: 'match' },
        { field: 'Date of birth', stated: '9 February 1987', document: '9 February 1987', register: 'February 1987', result: 'match', note: 'The public register shows month and year only.' },
        { field: 'Appointment', stated: 'Director and PSC', document: 'Not shown', register: 'Director and PSC since 17 September 2019', result: 'match' },
      ],
      observations: [
        { id: 'o-131-1', severity: 'info', title: 'All details match the register', detail: 'Name and date of birth from the passport chip agree with the application and the Companies House register.', source: 'Passport chip data, Companies House officer and PSC records' },
        { id: 'o-131-2', severity: 'info', title: 'One identity document was sufficient', detail: 'The passport chip was validated and the address history is consistent, so no supporting evidence was needed.', source: 'Application, passport chip data' },
      ],
      evidence: [
        { id: 'ev-131-1', kind: 'identity_document', label: 'UK passport, chip read in app', uploadedAt: at(-14 * HOUR - 30 * 60000), aiCheck: 'accepted', aiNote: 'Document in date. Chip signature validated by the certified identity provider.' },
        { id: 'ev-131-2', kind: 'selfie', label: 'Liveness capture', uploadedAt: at(-14 * HOUR - 30 * 60000), aiCheck: 'accepted' },
      ],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-FS-7Q4K', paidAt: at(-14 * HOUR - 40 * 60000), reference: 'PAY-2026-004131' },
    },

    // Aidan Corrigan: register mismatch halts Route A and opens a Route B correction
    {
      id: 'EO-2026-000127',
      route: 'A',
      personId: 'p-aidan',
      companyNumber: '99630741',
      origin: 'agent_invite',
      agentId: 'agent-belgrave',
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-marsh',
      option: 1,
      status: 'halted_register_mismatch',
      createdAt: at(-7 * DAY),
      submittedForReviewAt: at(-5 * DAY),
      slaDueAt: at(-5 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-5 * DAY - 2 * HOUR), 'IDV-7F31-1F88', 97.1),
      comparison: [
        { field: 'Full name', stated: 'Aidan Patrick Corrigan', document: 'AIDAN PATRICK CORRIGAN', register: 'CORRIGAN, Aiden Patrick', result: 'mismatch', note: 'First name is spelt Aiden on the register and Aidan on the passport.' },
        { field: 'Date of birth', stated: '14 March 1979', document: '14 March 1979', register: 'March 1979', result: 'match', note: 'The public register shows month and year only.' },
        { field: 'Appointment', stated: 'Director', document: 'Not shown', register: 'Director since 29 February 2008', result: 'match' },
      ],
      observations: [
        { id: 'o-127-1', severity: 'mismatch', title: 'Name does not match the Companies House register', detail: 'The passport chip reads AIDAN. The register holds AIDEN. Identity details must match the register exactly, so this verification is paused until the register is corrected.', source: 'Passport chip data, Companies House officer record' },
      ],
      evidence: [
        { id: 'ev-127-1', kind: 'identity_document', label: 'Irish passport, chip read in app', uploadedAt: at(-5 * DAY - 3 * HOUR), aiCheck: 'accepted', aiNote: 'Document in date. Chip signature validated by the certified identity provider.' },
        { id: 'ev-127-2', kind: 'selfie', label: 'Liveness capture', uploadedAt: at(-5 * DAY - 3 * HOUR), aiCheck: 'accepted' },
      ],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-BF-3M8T', paidAt: at(-5 * DAY - 4 * HOUR), reference: 'PAY-2026-004127' },
      correctionTaskId: 'FL-2026-000042',
    },

    // Grace Whitaker: B2C client allocated to Harcourt Lane, waiting for review
    {
      id: 'EO-2026-000134',
      route: 'A',
      personId: 'p-grace',
      companyNumber: '99712058',
      origin: 'b2c',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'in_review',
      createdAt: at(-1 * DAY),
      submittedForReviewAt: at(-5 * HOUR),
      slaDueAt: at(-5 * HOUR + SLA_HOURS * HOUR),
      idvt: {
        ...passAll(at(-5 * HOUR - 15 * 60000), 'IDV-7F31-2E40', 95.9),
        pepSanctionsDetail: 'One possible name match was found and discounted by the certified identity provider (different date of birth and nationality).',
      },
      comparison: [
        { field: 'Full name', stated: 'Grace Elizabeth Whitaker', document: 'GRACE ELIZABETH WHITAKER', register: 'WHITAKER, Grace Elizabeth', result: 'match' },
        { field: 'Date of birth', stated: '8 June 1972', document: '8 June 1972', register: 'June 1972', result: 'match' },
        { field: 'Appointment', stated: 'Director and PSC', document: 'Not shown', register: 'Director and PSC since 1 March 2021', result: 'match' },
      ],
      observations: [
        { id: 'o-134-1', severity: 'attention', title: 'Possible PEP name match was discounted', detail: 'The screening returned one possible match by name. The provider discounted it on date of birth and nationality. Shown so the reviewer can confirm.', source: 'PEP and sanctions screening result' },
      ],
      evidence: [
        { id: 'ev-134-1', kind: 'identity_document', label: 'UK passport, chip read in app', uploadedAt: at(-5 * HOUR - 25 * 60000), aiCheck: 'accepted', aiNote: 'Document in date. Chip signature validated by the certified identity provider.' },
        { id: 'ev-134-2', kind: 'selfie', label: 'Liveness capture', uploadedAt: at(-5 * HOUR - 25 * 60000), aiCheck: 'accepted' },
      ],
      payment: { method: 'pay_myself', amount: fee, paidAt: at(-5 * HOUR - 35 * 60000), reference: 'PAY-2026-004134' },
    },

    // Daniel Okafor: invite opened, journey not started. This is the live phone demo.
    {
      id: 'EO-2026-000135',
      route: 'A',
      personId: 'p-daniel',
      companyNumber: '99520316',
      origin: 'agent_invite',
      agentId: 'agent-fenwick',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'invited',
      createdAt: at(-1 * DAY),
      idvt: pending,
      comparison: [],
      observations: [],
      evidence: [],
    },

    // Marcus Hale: verified last year, reverification now due
    {
      id: 'EO-2025-000061',
      route: 'A',
      personId: 'p-marcus',
      companyNumber: '99520316',
      origin: 'agent_invite',
      agentId: 'agent-fenwick',
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-okoro',
      option: 1,
      status: 'submitted',
      createdAt: at(-352 * DAY),
      submittedForReviewAt: at(-351 * DAY),
      slaDueAt: at(-351 * DAY + SLA_HOURS * HOUR),
      idvt: passAll(at(-351 * DAY - HOUR), 'IDV-5B02-0E19', 96.9),
      comparison: [],
      observations: [],
      evidence: [{ id: 'ev-61-1', kind: 'identity_document', label: 'UK passport, chip read in app', uploadedAt: at(-351 * DAY - 2 * HOUR), aiCheck: 'accepted' }],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-FS-7Q4K', paidAt: at(-351 * DAY - 3 * HOUR), reference: 'PAY-2025-002061' },
      decision: { outcome: 'approve', reasonCode: 'APR-01', decidedAt: at(-350 * DAY), reviewerId: 'rev-okoro' },
      submission: { handedOffAt: at(-350 * DAY + HOUR), submittedAt: at(-350 * DAY + 2 * HOUR), personalCode: 'P3V8T6N1QZD' },
    },

    // Fiona Corrigan: started and abandoned. Kept for 7 years like any other record.
    {
      id: 'EO-2026-000102',
      route: 'A',
      personId: 'p-fiona',
      companyNumber: '99630741',
      origin: 'agent_invite',
      agentId: 'agent-belgrave',
      acspId: 'acsp-harcourt',
      option: 1,
      status: 'abandoned',
      createdAt: at(-76 * DAY),
      idvt: pending,
      comparison: [],
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
      origin: 'agent_invite',
      agentId: 'agent-belgrave',
      acspId: 'acsp-harcourt',
      reviewerId: 'rev-okoro',
      option: 1,
      status: 'declined',
      createdAt: at(-330 * DAY),
      submittedForReviewAt: at(-328 * DAY),
      slaDueAt: at(-328 * DAY + SLA_HOURS * HOUR),
      idvt: { ...passAll(at(-328 * DAY - HOUR), 'IDV-5B02-0F77', 94.2), documentAuthenticity: 'refer' },
      comparison: [],
      observations: [
        { id: 'o-88-1', severity: 'attention', title: 'Identity document expired beyond the permitted period', detail: 'The passport expired more than 6 months before the check. No other qualifying document was provided.', source: 'Passport chip data, expiry date' },
      ],
      evidence: [{ id: 'ev-88-1', kind: 'identity_document', label: 'UK passport, chip read in app', uploadedAt: at(-328 * DAY - 2 * HOUR), aiCheck: 'flagged', aiNote: 'Expired beyond the permitted period.' }],
      payment: { method: 'agent_payment_code', amount: fee, code: 'APC-BF-3M8T', paidAt: at(-328 * DAY - 3 * HOUR), reference: 'PAY-2025-002088' },
      decision: { outcome: 'decline', reasonCode: 'DEC-01', note: 'No unexpired qualifying identity document provided.', decidedAt: at(-327 * DAY), reviewerId: 'rev-okoro' },
    },
  ]

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

  const invites: Invite[] = [
    { id: 'INV-2026-000301', personId: 'p-margaret', companyNumber: '99418027', agentId: 'agent-fenwick', sentAt: at(-42 * DAY), paymentCode: 'APC-FS-7Q4K', status: 'accepted', caseId: 'EO-2026-000118' },
    { id: 'INV-2026-000302', personId: 'p-thomas', companyNumber: '99418027', agentId: 'agent-fenwick', sentAt: at(-7 * DAY), paymentCode: 'APC-FS-7Q4K', status: 'accepted', caseId: 'EO-2026-000129' },
    { id: 'INV-2026-000317', personId: 'p-priya', companyNumber: '99520316', agentId: 'agent-fenwick', sentAt: at(-3 * DAY), paymentCode: 'APC-FS-7Q4K', status: 'accepted', caseId: 'EO-2026-000131' },
    { id: 'INV-2026-000318', personId: 'p-daniel', companyNumber: '99520316', agentId: 'agent-fenwick', sentAt: at(-1 * DAY), paymentCode: 'APC-FS-7Q4K', status: 'opened', caseId: 'EO-2026-000135' },
    { id: 'INV-2026-000288', personId: 'p-aidan', companyNumber: '99630741', agentId: 'agent-belgrave', sentAt: at(-8 * DAY), paymentCode: 'APC-BF-3M8T', status: 'accepted', caseId: 'EO-2026-000127' },
    { id: 'INV-2026-000254', personId: 'p-fiona', companyNumber: '99630741', agentId: 'agent-belgrave', sentAt: at(-77 * DAY), paymentCode: 'APC-BF-3M8T', status: 'expired', caseId: 'EO-2026-000102' },
  ]

  const audit: AuditInput[] = [
    { at: at(-77 * DAY), actor: 'Oliver Grant, Belgrave Family Office', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000102', detail: 'Invite INV-2026-000254 sent to Fiona Corrigan with a pre-authorised Agent Payment Code.' },
    { at: at(-46 * DAY), actor: 'Evidence One', actorType: 'system', action: 'case.abandoned', caseId: 'EO-2026-000102', detail: 'No activity for 30 days. Case closed as abandoned. Record retained for 7 years.' },

    { at: at(-42 * DAY), actor: 'Rachel Fenwick, Fenwick & Shaw', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000118', detail: 'Invite INV-2026-000301 sent to Margaret Ashby, pre-filled from the register.' },
    { at: at(-40 * DAY - 2 * HOUR), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: 'EO-2026-000118', detail: 'Chip read, authenticity, liveness, face match 97.8%, PEP and sanctions: all passed.' },
    { at: at(-40 * DAY - 2 * HOUR + 60000), actor: 'Evidence One Intelligence', actorType: 'ai', action: 'ai.observation.created', caseId: 'EO-2026-000118', detail: 'Register comparison complete. No mismatch. Advisory only.' },
    { at: at(-39 * DAY), actor: 'Eleanor Marsh, Harcourt Lane', actorType: 'person', action: 'case.decision.approved', caseId: 'EO-2026-000118', detail: 'Approved. Reason APR-01. Retention period starts.' },
    { at: at(-39 * DAY + 2 * HOUR), actor: 'Eleanor Marsh, Harcourt Lane', actorType: 'person', action: 'submission.handoff', caseId: 'EO-2026-000118', detail: 'Submission pack prepared. Handed off to GOV.UK One Login.' },
    { at: at(-39 * DAY + 3 * HOUR), actor: 'Eleanor Marsh, Harcourt Lane', actorType: 'person', action: 'submission.recorded', caseId: 'EO-2026-000118', detail: 'Companies House personal code recorded.' },

    { at: at(-8 * DAY), actor: 'Oliver Grant, Belgrave Family Office', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000127', detail: 'Invite INV-2026-000288 sent to Aidan Corrigan, pre-filled from the register.' },
    { at: at(-5 * DAY - 2 * HOUR), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: 'EO-2026-000127', detail: 'Chip read, authenticity, liveness, face match 97.1%, PEP and sanctions: all passed.' },
    { at: at(-5 * DAY - 2 * HOUR + 60000), actor: 'Evidence One Intelligence', actorType: 'ai', action: 'ai.flag.register_mismatch', caseId: 'EO-2026-000127', detail: 'First name differs from the register (Aidan on passport, Aiden on register). Advisory flag raised for the reviewer.' },
    { at: at(-5 * DAY + 3 * HOUR), actor: 'Eleanor Marsh, Harcourt Lane', actorType: 'person', action: 'route_a.halted', caseId: 'EO-2026-000127', detail: 'Route A paused. Route B correction task FL-2026-000042 (ACSP04) created.' },

    { at: at(-7 * DAY), actor: 'Rachel Fenwick, Fenwick & Shaw', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000129', detail: 'Invite INV-2026-000302 sent to Thomas Ashby, pre-filled from the register.' },
    { at: at(-4 * DAY - 3 * HOUR), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: 'EO-2026-000129', detail: 'Authenticity, liveness, face match 96.4%, PEP and sanctions: all passed.' },
    { at: at(-4 * DAY - 2 * HOUR), actor: 'Evidence One Intelligence', actorType: 'ai', action: 'ai.flag.evidence_date', caseId: 'EO-2026-000129', detail: 'Address evidence appears older than 3 months. Advisory flag raised for the reviewer.' },
    { at: at(-2 * DAY), actor: 'Eleanor Marsh, Harcourt Lane', actorType: 'person', action: 'case.decision.request_info', caseId: 'EO-2026-000129', detail: 'More information requested. Reason RFI-02.' },

    { at: at(-3 * DAY), actor: 'Rachel Fenwick, Fenwick & Shaw', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000131', detail: 'Invite INV-2026-000317 sent to Priya Raman, pre-filled from the register.' },
    { at: at(-14 * HOUR - 20 * 60000), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: 'EO-2026-000131', detail: 'Chip read, authenticity, liveness, face match 98.6%, PEP and sanctions: all passed.' },
    { at: at(-14 * HOUR), actor: 'Rachel Fenwick, Fenwick & Shaw', actorType: 'person', action: 'case.referred', caseId: 'EO-2026-000131', detail: 'Referred to Harcourt Lane Solicitors LLP for review through the Evidence One marketplace.' },

    { at: at(-1 * DAY), actor: 'Evidence One', actorType: 'system', action: 'b2c.allocated', caseId: 'EO-2026-000134', detail: 'Direct client allocated to Harcourt Lane Solicitors LLP by the allocation rota.' },
    { at: at(-5 * HOUR - 15 * 60000), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: 'EO-2026-000134', detail: 'Chip read, authenticity, liveness, face match 95.9%. One PEP name match discounted.' },

    { at: at(-1 * DAY), actor: 'Rachel Fenwick, Fenwick & Shaw', actorType: 'person', action: 'invite.sent', caseId: 'EO-2026-000135', detail: 'Invite INV-2026-000318 sent to Daniel Okafor with a pre-authorised Agent Payment Code.' },
    { at: at(-20 * HOUR), actor: 'Daniel Okafor', actorType: 'person', action: 'invite.opened', caseId: 'EO-2026-000135', detail: 'Invite link opened in the Evidence One app.' },
  ]

  return { cases, corrections, invites, audit }
}
