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
  audience:
    'Individual' | 'Referral Partner' | 'ACSP reviewer' | 'Administrator'
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
      audience: 'Referral Partner',
      channel: 'email',
      recipient: 'rachel@fenwickshaw.example',
      template: 'partner_digest',
      subject: 'Weekly status summary: 3 people still to start',
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
      template: 'register_difference',
      subject:
        'Harcourt Lane Solicitors LLP is reviewing a difference with the register',
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
      audience: 'Referral Partner',
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
    id: 'partner_digest',
    label: 'Referral Partner status summary (status only)',
    audience: 'Referral Partner',
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
  | 'platform_admin'
  | 'super_admin'
  | 'acsp_admin'
  | 'acsp_reviewer'
  | 'partner_admin'
  | 'referrer'
  | 'portfolio_viewer'
  | 'individual'
  | 'ai'
  | 'rules'

export const roles: {
  id: RoleId
  label: string
  note: string
  group: 'Platform' | 'ACSP' | 'Referral Partner' | 'Individual' | 'Service'
  service?: boolean
}[] = [
  {
    id: 'platform_admin',
    label: 'Platform Administrator',
    note: 'Approves ACSPs and Referral Partners, manages allocation and monitoring, reads platform events',
    group: 'Platform',
  },
  {
    id: 'super_admin',
    label: 'Super Administrator',
    note: 'Fees, plans, commissions and rule publication, each with a second approver',
    group: 'Platform',
  },
  {
    id: 'acsp_admin',
    label: 'ACSP Administrator',
    note: 'Manages the ACSP firm, its profile and billing',
    group: 'ACSP',
  },
  {
    id: 'acsp_reviewer',
    label: 'ACSP Reviewer',
    note: 'Approves, requests information or declines',
    group: 'ACSP',
  },
  {
    id: 'partner_admin',
    label: 'Partner Administrator',
    note: 'Manages the Referral Partner and its team',
    group: 'Referral Partner',
  },
  {
    id: 'referrer',
    label: 'Referrer',
    note: 'Sends invites; sees status and check results',
    group: 'Referral Partner',
  },
  {
    id: 'portfolio_viewer',
    label: 'Portfolio Viewer',
    note: 'Reads status and check results only',
    group: 'Referral Partner',
  },
  {
    id: 'individual',
    label: 'Individual',
    note: 'A director or PSC, or a B2C client',
    group: 'Individual',
  },
  {
    id: 'ai',
    label: 'Evidence One Intelligence',
    note: 'Service account; writes observations only',
    group: 'Service',
    service: true,
  },
  {
    id: 'rules',
    label: 'Rules engine',
    note: 'Service account; evaluates rules',
    group: 'Service',
    service: true,
  },
]

export const capabilities: {
  label: string
  grants: RoleId[]
  /** Roles that hold the permission only with step-up (passkey or authenticator code, never SMS). */
  stepUp?: RoleId[]
  note?: string
}[] = [
  {
    label: 'See case status and check results',
    grants: [
      'acsp_admin',
      'acsp_reviewer',
      'partner_admin',
      'referrer',
      'portfolio_viewer',
      'individual',
    ],
    note: 'Referral Partners see status and check results only, never documents or messages',
  },
  {
    label: 'Open identity documents and evidence',
    grants: ['acsp_reviewer', 'individual'],
    note: 'An individual sees only their own. Neither administrator role can read evidence',
  },
  {
    label: 'Approve a case',
    grants: ['acsp_reviewer'],
    stepUp: ['acsp_reviewer'],
  },
  {
    label: 'Decline a case',
    grants: ['acsp_reviewer'],
    stepUp: ['acsp_reviewer'],
  },
  { label: 'Request information', grants: ['acsp_reviewer'] },
  {
    label: 'Start a submission to Companies House',
    grants: ['acsp_admin', 'acsp_reviewer'],
    stepUp: ['acsp_admin', 'acsp_reviewer'],
    note: 'Signed in with the ACSP’s own One Login at Companies House',
  },
  {
    label: 'Export a verification record',
    grants: ['acsp_admin', 'acsp_reviewer'],
    stepUp: ['acsp_admin', 'acsp_reviewer'],
  },
  {
    label: 'Send invites',
    grants: ['acsp_admin', 'partner_admin', 'referrer'],
  },
  {
    label: 'Approve an ACSP or Referral Partner at onboarding',
    grants: ['platform_admin'],
  },
  {
    label: 'Allocate a B2C client and run ACSP monitoring',
    grants: ['platform_admin'],
  },
  {
    label: 'Read platform events in the audit trail',
    grants: ['platform_admin', 'super_admin'],
    note: 'Platform chain only. Each ACSP chain belongs to that ACSP',
  },
  {
    label: 'Set fees and subscription plans',
    grants: ['super_admin'],
    stepUp: ['super_admin'],
    note: 'Super Administrator only, with a second approver',
  },
  {
    label: 'Switch referral commissions on',
    grants: ['super_admin'],
    stepUp: ['super_admin'],
    note: 'Super Administrator only, with a second approver',
  },
  {
    label: 'Publish a rule set',
    grants: ['super_admin'],
    stepUp: ['super_admin'],
    note: 'Super Administrator only, with a second approver',
  },
  {
    label: 'Place or lift a retention hold',
    grants: ['platform_admin', 'super_admin'],
    stepUp: ['platform_admin', 'super_admin'],
  },
  { label: 'Write an AI observation', grants: ['ai'] },
  { label: 'Record a rule result', grants: ['rules'] },
  {
    label: 'Edit or delete the audit trail',
    grants: [],
    note: 'No role holds this grant',
  },
]

/** Sign-in and step-up, shown on the Users and roles page. Step-up never uses SMS (H2, decided 19 October). */
export const signIn = {
  individuals: 'One-time code or passkey',
  professionals: 'Passkey or authenticator app',
  stepUp: 'Passkey or authenticator code, never SMS',
  idleProfessionalMinutes: 15,
  idleIndividualMinutes: 30,
}

export function buildUsers(now = Date.now()): PlatformUser[] {
  const u = (
    id: string,
    name: string,
    org: string,
    role: RoleId,
    factor: SecondFactor,
    ageMs: number,
    service = false,
  ): PlatformUser => ({
    id,
    name,
    org,
    role,
    factor,
    lastSeen: ago(ageMs, now),
    ...(service ? { service: true } : {}),
  })
  const harcourt = 'Harcourt Lane Solicitors LLP'
  const fenwick = 'Fenwick & Shaw Chartered Accountants'
  return [
    u(
      'rev-marsh',
      'Eleanor Marsh',
      harcourt,
      'acsp_reviewer',
      'Passkey',
      0.2 * HOUR,
    ),
    u(
      'rev-okoro',
      'James Okoro',
      harcourt,
      'acsp_reviewer',
      'Passkey and authenticator app',
      3 * HOUR,
    ),
    u(
      'rev-hartley',
      'Philippa Hartley',
      harcourt,
      'acsp_reviewer',
      'Passkey',
      1.2 * DAY,
    ),
    u(
      'rev-pell',
      'Alison Pell',
      'Alison Pell, Chartered Accountant',
      'acsp_admin',
      'Authenticator app',
      2 * DAY,
    ),
    u(
      'rev-basu',
      'Anjali Basu',
      'Northbank Compliance Ltd',
      'acsp_admin',
      'Authenticator app',
      5 * HOUR,
    ),
    u(
      'pu-fenwick-1',
      'Rachel Fenwick',
      fenwick,
      'partner_admin',
      'Passkey',
      0.6 * HOUR,
    ),
    u(
      'pu-fenwick-2',
      'Tariq Mahmood',
      fenwick,
      'referrer',
      'Passkey',
      1.5 * HOUR,
    ),
    u(
      'pu-fenwick-3',
      'Beth Lowry',
      fenwick,
      'portfolio_viewer',
      'Authenticator app',
      4 * DAY,
    ),
    u(
      'platform-admin',
      'Marcus Adeyemi',
      'Evidence One',
      'platform_admin',
      'Passkey and authenticator app',
      0.05 * HOUR,
    ),
    u(
      'super-1',
      'Helen Carver',
      'Evidence One',
      'super_admin',
      'Passkey and authenticator app',
      0.5 * HOUR,
    ),
    u(
      'super-2',
      'Daniel Achebe',
      'Evidence One',
      'super_admin',
      'Passkey',
      6 * HOUR,
    ),
    u(
      'svc-ai',
      'Evidence One Intelligence',
      'Service account',
      'ai',
      'Not applicable',
      0.4 * HOUR,
      true,
    ),
    u(
      'svc-rules',
      'Rules engine',
      'Service account',
      'rules',
      'Not applicable',
      0.4 * HOUR,
      true,
    ),
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
    note: 'Referral Partner brand on the journey. The instructed ACSP remains the service provider.',
    journeys: 312,
  },
  {
    id: 'meridian',
    name: 'Meridian Gulf Corporate Services',
    address: 'id.meridiangulf.example',
    brand: '#5b2a3c',
    ink: '#ffffff',
    state: 'configuring',
    note: 'Brand set, sender domain awaiting DNS records. The ACSP is named on every screen.',
    journeys: 0,
  },
  {
    id: 'northbank',
    name: 'Northbank Compliance Ltd',
    address: 'verify.northbank.example',
    brand: '#1e3a5f',
    ink: '#ffffff',
    state: 'planned',
    note: 'An ACSP brand on its own clients’ journey. Same platform, no duplicated rules.',
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
      label: 'Archive move for ACSPs without a paid subscription',
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
