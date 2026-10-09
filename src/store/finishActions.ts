import type { AuditInput } from '@/lib/audit'
import { looksLikeCode } from '@/lib/codeWarning'
import type { DemoData, EvidenceItem, LanguageCode } from '@/types/domain'
import type { ActionResult } from './actions'
import { respondToReallocation } from './platformActions'

/*
  Actions for the end of the individual's journey: proof of address and
  supporting evidence (with optional bank statement redaction), the supporting
  document helper, the personal code receipt question and the reallocation
  answer. Each returns the next data and the audit events to append.
*/

const DAY = 86_400_000

const personNameFor = (data: DemoData, caseId: string) => {
  const vc = data.cases.find((c) => c.id === caseId)
  const p = vc && data.people.find((x) => x.id === vc.personId)
  return p ? `${p.givenNames} ${p.familyName}` : 'Individual'
}

const patch = (
  data: DemoData,
  caseId: string,
  f: (c: DemoData['cases'][number]) => DemoData['cases'][number],
): DemoData => ({
  ...data,
  cases: data.cases.map((c) => (c.id === caseId ? f(c) : c)),
})

export interface SupportingUploadInput {
  /** 'address' for ADDL-02 proof of address, 'evidence' for ADDL-01 or ADDL-03. */
  purpose: 'address' | 'evidence'
  supportingType: NonNullable<EvidenceItem['supportingType']>
  fileLabel: string
  /** Days before today that the extracted issue date falls. */
  ageDays: number
  /** Option O3: the individual confirmed the redaction. Only the masked copy is kept. */
  redacted?: boolean
}

/**
  Records an uploaded supporting document with the AI date check. The original
  file is never stored: for a redacted bank statement only the redacted copy is
  kept, and the item records what was masked.
*/
export function recordSupportingUpload(
  data: DemoData,
  caseId: string,
  input: SupportingUploadInput,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = Date.now()
  const at = new Date(now).toISOString()
  const item: EvidenceItem = {
    id: `ev-${caseId}-${input.purpose === 'address' ? 'addr' : 'sup'}`,
    kind: 'address_evidence',
    supportingType: input.supportingType,
    label: input.redacted
      ? `${input.fileLabel} (redacted copy)`
      : input.fileLabel,
    uploadedAt: at,
    documentDate: new Date(now - input.ageDays * DAY).toISOString(),
    showsAddress: true,
    showsName: true,
    note:
      input.purpose === 'address'
        ? 'Proof of current address (ADDL-02).'
        : 'Supporting document (ADDL-01 or ADDL-03).',
    ...(input.redacted
      ? {
          redaction: {
            status: 'confirmed_by_individual' as const,
            confirmedAt: at,
            masked: ['Transaction amounts', 'Payees'],
          },
        }
      : {}),
  }
  const others = (vc.journey?.supportingItems ?? []).filter(
    (e) => e.id !== item.id,
  )
  const next = patch(data, caseId, (c) => ({
    ...c,
    status: c.status === 'invited' ? 'in_progress' : c.status,
    journey: {
      ...c.journey,
      supportingItems: [...others, item],
      ...(input.purpose === 'address'
        ? { addressProofDone: true }
        : { evidenceUploaded: true }),
    },
  }))
  const who = personNameFor(data, caseId)
  const audit: AuditInput[] = [
    {
      at,
      actor: 'Evidence One Intelligence',
      actorType: 'ai',
      action: 'ai.evidence_checked',
      caseId,
      detail: `AI observation: ${input.fileLabel} checked at upload. Issue date read as ${input.ageDays} days before upload, name and current address appear to match. Advisory only. The ACSP reviewer decides.`,
    },
  ]
  if (input.redacted)
    audit.push({
      at,
      actor: who,
      actorType: 'person',
      action: 'evidence.redaction.confirmed',
      caseId,
      detail:
        'Bank statement redaction (option O3) previewed and confirmed. Transaction amounts and payees masked. Only the redacted copy is passed to the ACSP and kept.',
    })
  return { data: next, audit }
}

/**
  After submitForReview has built the case evidence, put the supporting
  documents held in the journey into it, with any redaction record, and replace
  the generic bank-statement observation with one that matches what was uploaded.
*/
export function attachSupportingEvidence(
  data: DemoData,
  caseId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const items = vc?.journey?.supportingItems
  if (!vc || !items?.length) return { data, audit: [] }
  const ids = new Set(items.map((i) => i.id))
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      evidence: [
        ...c.evidence.filter(
          (e) => e.kind !== 'address_evidence' && !ids.has(e.id),
        ),
        ...items,
      ],
      observations: [
        ...c.observations.filter((o) => o.ruleId !== 'ADDL-11'),
        {
          id: `o-${caseId}-addr`,
          step: 'evidence' as const,
          ruleId: 'ADDL-11',
          severity: 'info' as const,
          title: 'Supporting document checked at upload',
          detail: `${items.length === 1 ? 'The document appears' : 'The documents appear'} to be dated within the supporting evidence period and to show the declared name and current address.${items.some((i) => i.redaction) ? ' A bank statement was redacted by the individual before it reached you.' : ''}`,
          source: 'Supporting document, issue date and address (AI extraction)',
        },
      ],
    })),
    audit: [],
  }
}

/** The individual replies to an information request with a new document. */
export function provideRequestedDocument(
  data: DemoData,
  caseId: string,
  input: Omit<SupportingUploadInput, 'purpose'>,
): ActionResult {
  const up = recordSupportingUpload(data, caseId, {
    ...input,
    purpose: 'evidence',
  })
  const vc = up.data.cases.find((c) => c.id === caseId)
  if (!vc) return up
  const at = new Date().toISOString()
  const items = vc.journey?.supportingItems ?? []
  const fresh = items.find((i) => i.id === `ev-${caseId}-sup`)
  const next = patch(up.data, caseId, (c) => ({
    ...c,
    status: 'in_review',
    evidence: [
      ...c.evidence.filter((e) => e.id !== fresh?.id),
      ...(fresh ? [fresh] : []),
    ],
  }))
  return {
    data: next,
    audit: [
      ...up.audit,
      {
        at,
        actor: personNameFor(data, caseId),
        actorType: 'person',
        action: 'case.information.provided',
        caseId,
        detail:
          'The individual replied to the information request with one new supporting document. The case is back in review.',
      },
    ],
  }
}

/** Every helper exchange is logged to the case audit trail. */
export function logHelperExchange(
  data: DemoData,
  caseId: string,
  question: string,
  answerId: string,
  language: LanguageCode,
): ActionResult {
  const text = question.trim()
  const shown = looksLikeCode(text)
    ? '[text not kept]'
    : `"${text.slice(0, 140)}"`
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor: 'AI assistant, Evidence One Intelligence',
        actorType: 'ai',
        action: 'helper.exchange',
        caseId,
        detail: `Supporting-document helper (deterministic, language ${language}). Question ${shown}. Answer: ${answerId === 'outside' ? 'outside the approved list, declined' : answerId}. Advisory only.`,
      },
    ],
  }
}

/** M7: the individual says whether the personal code has arrived. The code itself is never collected. */
export function answerCodeReceipt(
  data: DemoData,
  caseId: string,
  answer: 'yes' | 'not_yet',
): ActionResult {
  const at = new Date().toISOString()
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      personalCodeReceipt: {
        askedAt: c.personalCodeReceipt?.askedAt ?? at,
        answer,
        answeredAt: at,
      },
    })),
    audit: [
      {
        at,
        actor: personNameFor(data, caseId),
        actorType: 'person',
        action: 'case.personal_code.answered',
        caseId,
        detail: `The individual answered "${answer === 'yes' ? 'Yes' : 'Not yet'}" to whether the code from Companies House has arrived. No code was collected.`,
      },
    ],
  }
}

/** Presenter control: skip to the day after Companies House confirms, so the question appears. */
export function showNextDay(data: DemoData, caseId: string): ActionResult {
  const at = new Date().toISOString()
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      personalCodeReceipt: c.personalCodeReceipt ?? { askedAt: at },
    })),
    audit: [
      {
        at,
        actor: 'Evidence One',
        actorType: 'system',
        action: 'case.personal_code.asked',
        caseId,
        detail:
          'The day after Companies House confirmed, the individual was asked whether the personal code has arrived.',
      },
    ],
  }
}

/** ACSP-13: the individual agrees or declines to move to another ACSP. Owned by the platform actions. */
export function answerReallocation(
  data: DemoData,
  caseId: string,
  response: 'agreed' | 'declined',
): ActionResult {
  return respondToReallocation(data, caseId, response)
}
