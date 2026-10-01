/*
 * Synthetic data for the Admin pages: compliance posture, the message log,
 * users and roles, and white-label deployments. Every person and firm is fictional.
 */

const HOUR = 3_600_000
const DAY = 24 * HOUR
export const ago = (ms: number, now = Date.now()) =>
  new Date(now - ms).toISOString()

/* Notifications: every message the platform has sent. Messages carry status and links, never evidence. */

export type MessageState = 'delivered' | 'opened' | 'bounced' | 'queued'
export type MessageChannel = 'email' | 'sms'

export interface PlatformMessage {
  id: string
  at: string
  recipient: string
  audience: 'Individual' | 'Agent' | 'ACSP reviewer' | 'Administrator'
  channel: MessageChannel
  template: string
  subject: string
  state: MessageState
  caseId?: string
}

export function buildMessages(now = Date.now()): PlatformMessage[] {
  const m = (
    h: number,
    rest: Omit<PlatformMessage, 'id' | 'at'>,
    i: number,
  ): PlatformMessage => ({ id: `msg-${i}`, at: ago(h * HOUR, now), ...rest })
  return [
    {
      audience: 'ACSP reviewer',
      channel: 'email',
      recipient: 'eleanor.marsh@harcourtlane.example',
      template: 'reviewer_queue',
      subject: '4 cases are waiting for your review',
      state: 'opened',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'priya@lumenfield.example',
      template: 'submitted_for_review',
      subject: 'Your details are with Harcourt Lane Solicitors LLP',
      state: 'delivered',
      caseId: 'EO-2026-000131',
    },
    {
      audience: 'Individual',
      channel: 'sms',
      recipient: '+44 7700 900 412',
      template: 'mobile_code',
      subject: 'Your Evidence One code. It expires in 10 minutes.',
      state: 'delivered',
      caseId: 'EO-2026-000135',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'tom.ashby@example.com',
      template: 'evidence_request',
      subject: 'We need one supporting document',
      state: 'opened',
      caseId: 'EO-2026-000129',
    },
    {
      audience: 'Agent',
      channel: 'email',
      recipient: 'rachel@fenwickshaw.example',
      template: 'agent_digest',
      subject: 'Weekly summary: 3 people still to start',
      state: 'opened',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'daniel@lumenfield.example',
      template: 'invitation',
      subject: 'Fenwick & Shaw has asked you to verify your identity',
      state: 'delivered',
      caseId: 'EO-2026-000135',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'aidan@corriganmarine.example',
      template: 'register_correction',
      subject: 'Your verification is paused while the register is corrected',
      state: 'opened',
      caseId: 'EO-2026-000127',
    },
    {
      audience: 'Administrator',
      channel: 'email',
      recipient: 'daniel.achebe@evidenceone.example',
      template: 'ruleset_pending',
      subject: 'A rule set draft is waiting for second approval',
      state: 'opened',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'margaret.ashby@example.com',
      template: 'verification_complete',
      subject:
        'Harcourt Lane Solicitors LLP has completed your identity verification',
      state: 'opened',
      caseId: 'EO-2026-000118',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'nadia.kerr@example.invalid',
      template: 'invitation_reminder',
      subject: 'Reminder: your identity verification invite',
      state: 'bounced',
    },
    {
      audience: 'Individual',
      channel: 'email',
      recipient: 'fiona@corriganmarine.example',
      template: 'invitation_expired',
      subject: 'Your verification invite has expired',
      state: 'delivered',
    },
    {
      audience: 'Agent',
      channel: 'email',
      recipient: 'rachel@fenwickshaw.example',
      template: 'status_change',
      subject: 'Margaret Ashby: Verified',
      state: 'opened',
      caseId: 'EO-2026-000118',
    },
  ].map((x, i) =>
    m(
      [0.3, 1.2, 2.1, 3.4, 5, 7.5, 11, 19, 26, 31, 44, 50][i],
      x as Omit<PlatformMessage, 'id' | 'at'>,
      i,
    ),
  )
}

export const messageTemplates = [
  { id: 'invitation', label: 'Invitation', audience: 'Individual', sent: 212 },
  {
    id: 'mobile_code',
    label: 'Mobile code',
    audience: 'Individual',
    sent: 198,
  },
  {
    id: 'submitted_for_review',
    label: 'With the ACSP',
    audience: 'Individual',
    sent: 158,
  },
  {
    id: 'verification_complete',
    label: 'Verification complete',
    audience: 'Individual',
    sent: 141,
  },
  {
    id: 'evidence_request',
    label: 'Supporting document request',
    audience: 'Individual',
    sent: 15,
  },
  {
    id: 'reviewer_queue',
    label: 'Reviewer queue digest',
    audience: 'ACSP reviewer',
    sent: 60,
  },
  {
    id: 'agent_digest',
    label: 'Agent weekly summary',
    audience: 'Agent',
    sent: 124,
  },
]

/* Users and roles */

export type SecondFactor =
  | 'Passkey'
  | 'Authenticator app'
  | 'Passkey and authenticator app'
  | 'Not applicable'

export interface PlatformUser {
  id: string
  name: string
  org: string
  role: RoleId
  factor: SecondFactor
  lastSeen: string
  service?: boolean
}

export type RoleId =
  'acsp_reviewer' | 'agent_acsp' | 'agent' | 'admin' | 'admin2' | 'ai' | 'rules'

export const roles: {
  id: RoleId
  label: string
  note: string
  service?: boolean
}[] = [
  {
    id: 'acsp_reviewer',
    label: 'ACSP reviewer',
    note: 'Decides cases for an ACSP firm',
  },
  {
    id: 'agent_acsp',
    label: 'Agent with ACSP status',
    note: 'May review in-house, or refer',
  },
  {
    id: 'agent',
    label: 'Agent without ACSP status',
    note: 'Refers to an ACSP; sees status only',
  },
  {
    id: 'admin',
    label: 'Administrator',
    note: 'Runs the platform; proposes rule changes',
  },
  {
    id: 'admin2',
    label: 'Second approver',
    note: 'Publishes rule set versions',
  },
  {
    id: 'ai',
    label: 'Evidence One Intelligence',
    note: 'Service account; writes observations only',
    service: true,
  },
  {
    id: 'rules',
    label: 'Rules engine',
    note: 'Service account; evaluates rules',
    service: true,
  },
]

export const capabilities: {
  label: string
  grants: RoleId[]
  note?: string
}[] = [
  {
    label: 'See case status',
    grants: ['acsp_reviewer', 'agent_acsp', 'agent', 'admin'],
  },
  {
    label: 'Open documents and evidence',
    grants: ['acsp_reviewer', 'agent_acsp'],
    note: 'Agents without ACSP status never see evidence',
  },
  {
    label: 'Approve or decline',
    grants: ['acsp_reviewer', 'agent_acsp'],
    note: 'With step-up every time',
  },
  { label: 'Request information', grants: ['acsp_reviewer', 'agent_acsp'] },
  { label: 'Refer to an ACSP', grants: ['agent_acsp', 'agent'] },
  {
    label: 'Submit to Companies House',
    grants: ['acsp_reviewer', 'agent_acsp'],
    note: 'With their own GOV.UK One Login',
  },
  {
    label: 'Export a verification record',
    grants: ['acsp_reviewer', 'admin'],
    note: 'With step-up',
  },
  { label: 'Propose a rule set change', grants: ['admin'] },
  { label: 'Publish a rule set version', grants: ['admin2'] },
  { label: 'Place or lift a retention hold', grants: ['admin'] },
  { label: 'Write an AI observation', grants: ['ai'] },
  { label: 'Record a rule result', grants: ['rules'] },
  {
    label: 'Edit or delete the audit trail',
    grants: [],
    note: 'No role holds this grant',
  },
]

export function buildUsers(now = Date.now()): PlatformUser[] {
  return [
    {
      id: 'rev-marsh',
      name: 'Eleanor Marsh',
      org: 'Harcourt Lane Solicitors LLP',
      role: 'acsp_reviewer',
      factor: 'Passkey',
      lastSeen: ago(0.2 * HOUR, now),
    },
    {
      id: 'rev-okoro',
      name: 'James Okoro',
      org: 'Harcourt Lane Solicitors LLP',
      role: 'acsp_reviewer',
      factor: 'Passkey and authenticator app',
      lastSeen: ago(3 * HOUR, now),
    },
    {
      id: 'rev-hartley',
      name: 'Philippa Hartley',
      org: 'Harcourt Lane Solicitors LLP',
      role: 'acsp_reviewer',
      factor: 'Passkey',
      lastSeen: ago(1.2 * DAY, now),
    },
    {
      id: 'rev-basu',
      name: 'Anjali Basu',
      org: 'Northbank Compliance Ltd',
      role: 'acsp_reviewer',
      factor: 'Authenticator app',
      lastSeen: ago(5 * HOUR, now),
    },
    {
      id: 'rev-dunmore',
      name: 'Callum Dunmore',
      org: 'Pell & Rowe Chartered Accountants',
      role: 'acsp_reviewer',
      factor: 'Passkey',
      lastSeen: ago(2 * DAY, now),
    },
    {
      id: 'agent-contact',
      name: 'Rachel Fenwick',
      org: 'Fenwick & Shaw Chartered Accountants',
      role: 'agent_acsp',
      factor: 'Passkey',
      lastSeen: ago(0.6 * HOUR, now),
    },
    {
      id: 'agent-belgrave',
      name: 'Oliver Grant',
      org: 'Belgrave Family Office',
      role: 'agent',
      factor: 'Authenticator app',
      lastSeen: ago(4 * DAY, now),
    },
    {
      id: 'admin-1',
      name: 'Helen Carver',
      org: 'Evidence One',
      role: 'admin',
      factor: 'Passkey and authenticator app',
      lastSeen: ago(0.05 * HOUR, now),
    },
    {
      id: 'admin-2',
      name: 'Daniel Achebe',
      org: 'Evidence One',
      role: 'admin2',
      factor: 'Passkey',
      lastSeen: ago(6 * HOUR, now),
    },
    {
      id: 'svc-ai',
      name: 'Evidence One Intelligence',
      org: 'Service account',
      role: 'ai',
      factor: 'Not applicable',
      lastSeen: ago(0.4 * HOUR, now),
      service: true,
    },
    {
      id: 'svc-rules',
      name: 'Rules engine',
      org: 'Service account',
      role: 'rules',
      factor: 'Not applicable',
      lastSeen: ago(0.4 * HOUR, now),
      service: true,
    },
  ]
}

/* White label */

export interface Deployment {
  id: string
  name: string
  address: string
  brand: string
  ink: string
  state: 'live' | 'configuring' | 'planned'
  note: string
  journeys: number
}

export const deployments: Deployment[] = [
  {
    id: 'default',
    name: 'Evidence One',
    address: 'verify.evidenceone.example',
    brand: '#16181b',
    ink: '#ffffff',
    state: 'live',
    note: 'The default journey. Regulated content is controlled by the ACSP.',
    journeys: 1240,
  },
  {
    id: 'fenwick',
    name: 'Fenwick & Shaw Chartered Accountants',
    address: 'verify.fenwickshaw.example',
    brand: '#1f4d3a',
    ink: '#ffffff',
    state: 'live',
    note: 'Partner brand on the journey. Harcourt Lane remains the ACSP.',
    journeys: 312,
  },
  {
    id: 'belgrave',
    name: 'Belgrave Family Office',
    address: 'id.belgrave.example',
    brand: '#5b2a3c',
    ink: '#ffffff',
    state: 'configuring',
    note: 'Brand set, sender domain awaiting DNS records.',
    journeys: 0,
  },
  {
    id: 'northbank',
    name: 'Northbank Compliance Ltd',
    address: 'verify.northbank.example',
    brand: '#1e3a5f',
    ink: '#ffffff',
    state: 'planned',
    note: 'Same platform, different surface. No duplicated rules.',
    journeys: 0,
  },
]

export const partnerCan = [
  'Brand colour',
  'Logo',
  'Sender name and reply-to address',
  'Support contact details',
  'Web address for the journey',
  'Welcome message',
]
export const staysFixed = [
  'The attribution statement naming the ACSP',
  'Regulatory and privacy notices',
  'The rule set and how it is evaluated',
  'Who may approve or decline',
  'The audit trail',
  'Evidence storage and retention',
]

/* Compliance */

export type Posture = 'ok' | 'attention' | 'action'

export interface Obligation {
  label: string
  due: string
  owner: string
}

export function buildObligations(now = Date.now()): Obligation[] {
  return [
    {
      label: 'Biometric samples deletion run',
      due: new Date(now + 1 * DAY).toISOString(),
      owner: 'Platform, automatic',
    },
    {
      label: 'Quarterly access review',
      due: new Date(now + 9 * DAY).toISOString(),
      owner: 'Helen Carver',
    },
    {
      label: 'Option 2 training renewal, James Okoro',
      due: new Date(now + 23 * DAY).toISOString(),
      owner: 'Harcourt Lane Solicitors LLP',
    },
    {
      label: 'Data protection impact assessment review',
      due: new Date(now + 41 * DAY).toISOString(),
      owner: 'Helen Carver',
    },
    {
      label: 'Penetration test',
      due: new Date(now + 92 * DAY).toISOString(),
      owner: 'External tester',
    },
    {
      label: 'AML supervision review, Harcourt Lane',
      due: new Date(now + 181 * DAY).toISOString(),
      owner: 'Solicitors Regulation Authority',
    },
  ]
}
