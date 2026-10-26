import { suggestAcsps } from '@/lib/matching'
import type { BulkRequest, DemoData, VerificationCase } from '@/types/domain'
import { sendInvites, type ActionResult } from './actions'
import { criteriaForPerson } from './partnerSelectors'

/*
  Bulk / Bespoke Request (option O4). A Referral Partner asks in free text for
  several verifications or a mix of services. It goes to the Platform
  Administrator first, with a message area between the two. Once agreed, the
  administrator converts it into linked cases. Separate from normal automated
  referrals. Every step is a platform event on the audit trail.
*/

export const bulkRequestsOf = (data: DemoData) => data.bulkRequests ?? []

export const bulkRequestForCase = (data: DemoData, caseId: string) =>
  bulkRequestsOf(data).find((b) => b.caseIds.includes(caseId))

const nextId = (data: DemoData) => {
  const max = bulkRequestsOf(data).reduce(
    (m, b) => Math.max(m, Number(b.id.slice(-4)) || 0),
    0,
  )
  return `BR-2026-${String(max + 1).padStart(4, '0')}`
}

const patch = (
  data: DemoData,
  id: string,
  fn: (b: BulkRequest) => BulkRequest,
): DemoData => ({
  ...data,
  bulkRequests: bulkRequestsOf(data).map((b) => (b.id === id ? fn(b) : b)),
})

export function submitBulkRequest(
  data: DemoData,
  input: { partnerId: string; request: string; actor: string },
): ActionResult & { requestId: string } {
  const now = new Date().toISOString()
  const id = nextId(data)
  const request: BulkRequest = {
    id,
    partnerId: input.partnerId,
    submittedBy: input.actor,
    submittedAt: now,
    request: input.request.trim(),
    status: 'open',
    messages: [],
    caseIds: [],
    additionalServices: [],
    corporateRequested: false,
  }
  return {
    data: { ...data, bulkRequests: [...bulkRequestsOf(data), request] },
    audit: [
      {
        at: now,
        actor: input.actor,
        actorType: 'person',
        action: 'bulk_request.submitted',
        detail: `Bulk / Bespoke Request ${id} submitted. It goes to the Platform Administrator first.`,
      },
    ],
    requestId: id,
  }
}

export function postBulkMessage(
  data: DemoData,
  input: {
    requestId: string
    from: 'partner' | 'admin'
    authorName: string
    body: string
  },
): ActionResult {
  const now = new Date().toISOString()
  const b = bulkRequestsOf(data).find((x) => x.id === input.requestId)
  if (!b || !input.body.trim()) return { data, audit: [] }
  return {
    data: patch(data, b.id, (x) => ({
      ...x,
      messages: [
        ...x.messages,
        {
          id: `brm-${b.id.slice(-4)}-${x.messages.length + 1}`,
          from: input.from,
          authorName: input.authorName,
          at: now,
          body: input.body.trim(),
        },
      ],
    })),
    audit: [
      {
        at: now,
        actor: input.authorName,
        actorType: 'person',
        action: 'bulk_request.message',
        // The message text stays on the request, not in the audit entry.
        detail: `Message on Bulk / Bespoke Request ${b.id}, from the ${input.from === 'admin' ? 'Platform Administrator' : 'Referral Partner'}. Email notification sent.`,
      },
    ],
  }
}

export interface ConvertBulkInput {
  requestId: string
  /** People to verify, by company, from the Partner's connected companies. */
  people: { personId: string; companyNumber: string }[]
  additionalServices: string[]
  corporateRequested: boolean
  actor: string
}

/**
  Converts an agreed request into linked cases. Each person gets an individual
  verification case with the top matched ACSP, ranked by clear criteria, and
  the administrator's confirmation recorded on the allocation. Additional
  services and the corporate verification are placeholders only: no corporate
  evidence is collected.
*/
export function convertBulkRequest(
  data: DemoData,
  input: ConvertBulkInput,
): ActionResult & { caseIds: string[] } {
  const b = bulkRequestsOf(data).find((x) => x.id === input.requestId)
  if (!b || b.status === 'converted') return { data, audit: [], caseIds: [] }
  const partner = data.partners.find((p) => p.id === b.partnerId)
  let next = data
  const audit: ActionResult['audit'] = []
  const caseIds: string[] = []
  for (const p of input.people) {
    const ranked = suggestAcsps(
      next,
      criteriaForPerson(next, p.personId, p.companyNumber),
    )
    const acsp = ranked[0]?.acsp
    if (!acsp) continue
    const res = sendInvites(next, {
      companyNumber: p.companyNumber,
      personIds: [p.personId],
      partnerId: b.partnerId,
      actor: input.actor,
      instructingAcspId: acsp.id,
      shownAcspIds: ranked.slice(0, 3).map((s) => s.acsp.id),
      payer: 'client',
    })
    const created = res.data.cases.slice(next.cases.length)
    const now = new Date().toISOString()
    next = {
      ...res.data,
      cases: res.data.cases.map((c): VerificationCase =>
        created.some((x) => x.id === c.id)
          ? {
              ...c,
              allocation: {
                source: 'administrator',
                suggestedAcspIds: ranked.slice(0, 3).map((s) => s.acsp.id),
                confirmedBy: input.actor,
                confirmedAt: now,
              },
            }
          : c,
      ),
    }
    audit.push(...res.audit)
    caseIds.push(...created.map((c) => c.id))
  }
  const now = new Date().toISOString()
  next = patch(next, b.id, (x) => ({
    ...x,
    status: 'converted',
    convertedAt: now,
    convertedBy: input.actor,
    caseIds,
    additionalServices: input.additionalServices,
    corporateRequested: input.corporateRequested,
  }))
  audit.push({
    at: now,
    actor: input.actor,
    actorType: 'person',
    acspId: 'platform',
    action: 'bulk_request.converted',
    detail: `Bulk / Bespoke Request ${b.id} from ${partner?.name ?? 'a Referral Partner'} converted into linked cases: ${caseIds.length ? caseIds.join(', ') : 'no individual cases'}${input.additionalServices.length ? `, plus ${input.additionalServices.length} additional Companies House service placeholder${input.additionalServices.length === 1 ? '' : 's'}` : ''}${input.corporateRequested ? ', and a corporate verification to be added later' : ''}. ACSPs ranked by clear criteria, not AI, and confirmed by the administrator.`,
  })
  return { data: next, audit, caseIds }
}
