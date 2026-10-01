import { PRIMARY_ACSP_ID } from '@/data/organisations'
import type { AuditInput } from '@/lib/audit'
import { fullName } from '@/lib/format'
import type { DemoData, Invite, PaymentMethod, VerificationCase } from '@/types/domain'

/*
  Pure state transitions. Each returns the next data and the audit events to
  append, so every action is recorded in the hash-chained trail.
*/

export interface ActionResult {
  data: DemoData
  audit: AuditInput[]
}

function nextRef(existing: string[], prefix: string, start: number): string {
  const max = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .reduce((a, b) => Math.max(a, b), start)
  return `${prefix}${String(max + 1).padStart(6, '0')}`
}

export function connectCompany(data: DemoData, number: string, agentId: string, actor: string): ActionResult {
  const now = new Date().toISOString()
  const company = data.companies.find((c) => c.number === number)
  if (!company) return { data, audit: [] }
  return {
    data: {
      ...data,
      companies: data.companies.map((c) => (c.number === number ? { ...c, lodgedByAgentId: agentId, connectedAt: now } : c)),
    },
    audit: [
      {
        at: now,
        actor,
        actorType: 'person',
        action: 'company.connected',
        detail: `${company.name} (${company.number}) connected to the portal from the Companies House register.`,
      },
    ],
  }
}

export interface SendInvitesInput {
  companyNumber: string
  personIds: string[]
  agentId: string
  actor: string
  payment: PaymentMethod
  review: 'referred' | 'in_house'
}

export function sendInvites(data: DemoData, input: SendInvitesInput): ActionResult & { inviteIds: string[] } {
  const now = new Date().toISOString()
  const agent = data.agents.find((a) => a.id === input.agentId)
  const code = input.payment === 'agent_payment_code' ? agent?.paymentCode : undefined
  const invites: Invite[] = []
  const cases: VerificationCase[] = []
  const audit: AuditInput[] = []
  let inviteIds = data.invites.map((i) => i.id)
  let caseIds = data.cases.map((c) => c.id)

  for (const personId of input.personIds) {
    const person = data.people.find((p) => p.id === personId)
    if (!person) continue
    const inviteId = nextRef(inviteIds, 'INV-2026-', 0)
    const caseId = nextRef(caseIds, 'EO-2026-', 0)
    inviteIds = [...inviteIds, inviteId]
    caseIds = [...caseIds, caseId]
    const inHouse = input.review === 'in_house'
    invites.push({
      id: inviteId,
      personId,
      companyNumber: input.companyNumber,
      agentId: input.agentId,
      sentAt: now,
      paymentCode: code,
      status: 'sent',
      caseId,
      review: input.review,
    })
    cases.push({
      id: caseId,
      route: 'A',
      personId,
      companyNumber: input.companyNumber,
      origin: 'agent_invite',
      agentId: input.agentId,
      acspId: inHouse ? input.agentId : PRIMARY_ACSP_ID,
      inHouse,
      option: 1,
      status: 'invited',
      createdAt: now,
      idvt: { nfcChipRead: 'pending', documentAuthenticity: 'pending', liveness: 'pending', faceMatch: 'pending', pepSanctions: 'pending' },
      comparison: [],
      observations: [],
      evidence: [],
    })
    audit.push({
      at: now,
      actor: input.actor,
      actorType: 'person',
      action: 'invite.sent',
      caseId,
      detail: `Invite ${inviteId} sent to ${fullName(person)}, pre-filled from the register${code ? ` with Agent Payment Code ${code}` : ', individual pays by card'}. ${inHouse ? 'Reviewed in-house.' : 'Referred to Harcourt Lane Solicitors LLP.'}`,
    })
  }

  return {
    data: { ...data, invites: [...data.invites, ...invites], cases: [...data.cases, ...cases] },
    audit,
    inviteIds: invites.map((i) => i.id),
  }
}
