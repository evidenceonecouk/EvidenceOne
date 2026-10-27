import type { PartnerCheckResult } from '@/types/domain'

/*
  The certified identity provider's session report, reshaped for the ACSP panel.
  The provider's raw decision (its v3 "session decision" response) is read
  loosely: any block can be missing or null, and unknown fields are ignored.
  Nothing here decides anything. These are the provider's check results, which
  inform the ACSP reviewer's decision.
*/

export type ProviderResult = PartnerCheckResult

export interface ProviderFlag {
  check: string
  title: string
  detail?: string
  level: 'information' | 'warning' | 'error'
}

export interface Field {
  label: string
  value: string
}

export interface MediaItem {
  label: string
  src: string
  kind: 'image' | 'video'
}

export interface DocumentReport {
  result: ProviderResult
  type: string
  issuingState?: string
  issuingCode?: string
  fields: Field[]
  nonLatin: Field[]
  media: MediaItem[]
  portrait?: string
  mrz?: string
  security: { label: string; score: number; outcome: string }[]
  quality?: number
  flags: ProviderFlag[]
}

export interface ChipReport {
  result: ProviderResult
  read: boolean
  skipReason?: string
  fields: Field[]
  flags: ProviderFlag[]
}

export interface LivenessReport {
  result: ProviderResult
  score?: number
  method?: string
  video?: string
  reference?: string
  faceQuality?: number
  faceLuminance?: number
  ageEstimate?: number
  flags: ProviderFlag[]
}

export interface FaceMatchReport {
  result: ProviderResult
  score?: number
  source?: string
  target?: string
  flags: ProviderFlag[]
}

export interface DeviceReport {
  result: ProviderResult
  place?: string
  countryCode?: string
  lat?: number
  lng?: number
  fields: Field[]
  distances: Field[]
  flags: ProviderFlag[]
}

export interface ProviderEvent {
  at: number
  title: string
  detail?: string
  tone: 'ok' | 'bad' | 'neutral'
  where?: string
  device?: string
  location?: string
  media: string[]
}

export interface ProviderReport {
  id: string
  number?: number
  source: 'live' | 'sample'
  /** For the sample only: the fictional person whose illustrations stand in for media. */
  samplePersonId?: string
  status: string
  result: ProviderResult
  createdAt?: string
  reference?: string
  workflow?: string
  name: string
  contact: Field[]
  document?: DocumentReport
  chip?: ChipReport
  liveness?: LivenessReport
  faceMatch?: FaceMatchReport
  device?: DeviceReport
  events: ProviderEvent[]
  flags: ProviderFlag[]
}

type Raw = Record<string, unknown>

const obj = (v: unknown): Raw =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {}
const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v : undefined
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined
const first = (v: unknown): Raw | undefined =>
  Array.isArray(v) && v.length > 0 ? obj(v[v.length - 1]) : undefined

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

/** The provider's feature status, in the check vocabulary used everywhere else in the demo. */
export function resultOf(status: unknown): ProviderResult {
  const s = String(status ?? '').toLowerCase()
  if (s === 'approved') return 'passed'
  if (s === 'declined') return 'not_passed'
  if (s === 'in review') return 'flagged'
  return 'pending'
}

const checkNames: Record<string, string> = {
  ID_VERIFICATION: 'Identity document',
  NFC: 'Chip',
  LIVENESS: 'Liveness',
  FACEMATCH: 'Face match',
  FACE_MATCH: 'Face match',
  IP_ANALYSIS: 'Device and IP',
  POA: 'Proof of address',
}

function flagsOf(item: Raw | undefined, check: string): ProviderFlag[] {
  const list = Array.isArray(item?.warnings) ? item.warnings : []
  return list.map((w) => {
    const o = obj(w)
    const level = str(o.log_type)
    return {
      check: checkNames[str(o.feature) ?? ''] ?? check,
      title:
        str(o.short_description) ??
        titleCase(str(o.risk) ?? 'Observation from the provider'),
      detail: str(o.long_description),
      level:
        level === 'error'
          ? 'error'
          : level === 'warning'
            ? 'warning'
            : 'information',
    }
  })
}

const field = (label: string, value: unknown): Field | undefined => {
  const v = typeof value === 'number' ? String(value) : str(value)
  return v ? { label, value: v } : undefined
}
const fields = (...list: (Field | undefined)[]) =>
  list.filter((f): f is Field => !!f)

const genders: Record<string, string> = { F: 'Female', M: 'Male', X: 'X' }

function documentOf(raw: Raw | undefined): DocumentReport | undefined {
  if (!raw) return undefined
  const extra = obj(raw.extra_fields)
  const nonLatin = Object.entries({ ...extra, ...raw })
    .filter(([k, v]) => k.endsWith('_non_latin') && str(v))
    .map(([k, v]) => ({
      label: titleCase(k.replace(/_non_latin$/, '')) + ', original script',
      value: String(v),
    }))
  const media: MediaItem[] = []
  const add = (label: string, key: string, kind: 'image' | 'video') => {
    const src = str(raw[key])
    if (src) media.push({ label, src, kind })
  }
  add('Front', 'full_front_image', 'image')
  if (!str(raw.full_front_image)) add('Front', 'front_image', 'image')
  add('Back', 'full_back_image', 'image')
  if (!str(raw.full_back_image)) add('Back', 'back_image', 'image')
  add('Front, capture video', 'front_video', 'video')
  add('Back, capture video', 'back_video', 'video')

  const docLiveness = obj(raw.document_liveness)
  const securityNames: Record<string, string> = {
    portrait_replace: 'Photo not replaced',
    printed_copy: 'Not a printed copy',
    screen_replay: 'Not shown on a screen',
  }
  const security = Object.entries(securityNames).flatMap(([k, label]) => {
    const o = obj(docLiveness[k])
    const score = num(o.score)
    return score === undefined
      ? []
      : [{ label, score, outcome: str(o.bucket) ?? '' }]
  })
  const mrz = str(obj(raw.mrz).mrz_string)
  const gender = str(raw.gender)

  return {
    result: resultOf(raw.status),
    type: str(raw.document_type) ?? 'Identity document',
    issuingState: str(raw.issuing_state_name),
    issuingCode: str(raw.issuing_state),
    fields: fields(
      field('Document type', raw.document_type),
      field('Document number', raw.document_number),
      field('Personal number', raw.personal_number),
      field('Issuing state', raw.issuing_state_name),
      field('Nationality', raw.nationality),
      field('First names', raw.first_name),
      field('Surname', raw.last_name),
      field('Date of birth', raw.date_of_birth),
      field('Sex', gender ? (genders[gender] ?? gender) : undefined),
      field('Place of birth', raw.place_of_birth),
      field('Date of issue', raw.date_of_issue),
      field('Expiry date', raw.expiration_date),
      field('Address on the document', raw.formatted_address ?? raw.address),
    ),
    nonLatin,
    media,
    portrait: str(raw.portrait_image),
    mrz,
    security,
    quality: num(obj(raw.front_image_quality_score).overall_score),
    flags: flagsOf(raw, 'Identity document'),
  }
}

function chipOf(raw: Raw | undefined): ChipReport | undefined {
  if (!raw) return undefined
  const auth = obj(raw.authenticity)
  const cert = obj(raw.certificate_summary)
  const yes = (v: unknown) =>
    v === true ? 'Valid' : v === false ? 'Not valid' : undefined
  const read = raw.is_nfc_skipped !== true
  return {
    result: resultOf(raw.status),
    read,
    skipReason: str(raw.skip_reason),
    fields: fields(
      field('Chip read', read ? 'Yes' : 'No'),
      field('Security object (SOD)', yes(auth.sod_integrity)),
      field('Data groups', yes(auth.dg_integrity)),
      field('Certificate issuer', cert.issuer),
      field('Certificate valid until', cert.not_valid_after),
    ),
    flags: flagsOf(raw, 'Chip'),
  }
}

const methods: Record<string, string> = {
  PASSIVE: 'Passive',
  ACTIVE_3D: 'Active, 3D',
  FLASHING: 'Flashing',
}

function livenessOf(raw: Raw | undefined): LivenessReport | undefined {
  if (!raw) return undefined
  const method = str(raw.method)
  return {
    result: resultOf(raw.status),
    score: num(raw.score),
    method: method ? (methods[method] ?? titleCase(method)) : undefined,
    video: str(raw.video_url),
    reference: str(raw.reference_image),
    faceQuality: num(raw.face_quality),
    faceLuminance: num(raw.face_luminance),
    ageEstimate: num(raw.age_estimation),
    flags: flagsOf(raw, 'Liveness'),
  }
}

function faceMatchOf(raw: Raw | undefined): FaceMatchReport | undefined {
  if (!raw) return undefined
  return {
    result: resultOf(raw.status),
    score: num(raw.score),
    source: str(raw.source_image),
    target: str(raw.target_image),
    flags: flagsOf(raw, 'Face match'),
  }
}

const km = (v: unknown) => {
  const n = num(v)
  return n === undefined ? undefined : `${n.toFixed(1)} km`
}

function deviceOf(raw: Raw | undefined): DeviceReport | undefined {
  if (!raw) return undefined
  const place = [
    ...new Set([raw.ip_city, raw.ip_state, raw.ip_country].map(str)),
  ]
    .filter(Boolean)
    .join(', ')
  const yesNo = (v: unknown) =>
    v === true ? 'Yes' : v === false ? 'No' : undefined
  const tz = str(raw.time_zone)
  const offset = str(raw.time_zone_offset)
  return {
    result: resultOf(raw.status),
    place: place || undefined,
    countryCode: str(raw.ip_country_code),
    lat: num(raw.latitude),
    lng: num(raw.longitude),
    fields: fields(
      field('IP address', raw.ip_address),
      field('Location', place),
      field('Device platform', raw.platform),
      field('Device brand', raw.device_brand),
      field('Device model', raw.device_model),
      field('Operating system', raw.os_family),
      field('Browser', raw.browser_family),
      field('Internet provider', raw.isp ?? raw.organization),
      field('VPN or Tor', yesNo(raw.is_vpn_or_tor)),
      field('Data centre', yesNo(raw.is_data_center)),
      field('Time zone', tz && offset ? `${tz} (${offset})` : tz),
      field('Device fingerprint', raw.device_fingerprint),
      field('User agent', raw.user_agent),
      field('Accept language', raw.accept_language),
    ),
    distances: fields(
      field(
        'From the address on the identity document',
        km(obj(raw.ip).distance_from_id_document),
      ),
      field(
        'From the proof of address',
        km(obj(raw.ip).distance_from_poa_document),
      ),
    ),
    flags: flagsOf(raw, 'Device and IP'),
  }
}

const isMedia = (v: unknown): v is string =>
  typeof v === 'string' && /^https:\/\/\S+\.(jpe?g|png|webp)(\?|$)/i.test(v)

const eventTitles: Record<string, string> = {
  WORKFLOW_STATUS_NODE_REACHED: 'Provider result set',
  WORKFLOW_BRANCH_EVALUATED: 'Journey branch evaluated',
}

/* Device events have no fixed public schema, so read what is there and skip the rest. */
function eventsOf(raw: unknown): ProviderEvent[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((e): ProviderEvent | undefined => {
      const o = obj(e)
      const d = obj(o.details)
      const at = num(o.sent_at) ?? Date.parse(str(o.created_at) ?? '')
      if (!Number.isFinite(at)) return undefined
      const type = str(o.event_type) ?? str(o.type) ?? 'EVENT'
      const from = str(d.from) ?? str(d.previous_step) ?? str(d.from_status)
      const to = str(d.to) ?? str(d.next_step) ?? str(d.to_status)
      let detail = from && to ? `From ${from} to ${to}` : undefined
      if (type === 'WORKFLOW_BRANCH_EVALUATED')
        detail = `${str(d.node_label) ?? 'Branch'} evaluated, continued to ${str(d.next_node_label) ?? 'the next step'}`
      if (type === 'WORKFLOW_STATUS_NODE_REACHED')
        detail = `Set the provider result to ${str(d.resolved_session_status) ?? str(d.session_status) ?? 'a status'}`
      const device = obj(o.device ?? d.device)
      const deviceText = [
        str(device.device_model) ?? str(device.model),
        str(device.browser_family) ?? str(device.browser),
      ]
        .filter(Boolean)
        .join(', ')
      const loc = obj(o.location ?? d.location)
      const locText = [
        str(loc.ip_city) ?? str(loc.city),
        str(loc.ip_country) ?? str(loc.country),
        str(loc.ip_address) ?? str(o.ip_address),
      ]
        .filter(Boolean)
        .join(', ')
      const where = [str(o.component), str(o.feature_step) ?? str(o.step)]
        .filter(Boolean)
        .join(' · ')
      const lower = type.toLowerCase()
      return {
        at,
        title: str(o.title) ?? eventTitles[type] ?? titleCase(type),
        detail,
        tone: /invalid|fail|declin|error/.test(lower)
          ? 'bad'
          : /valid|approved|completed/.test(lower)
            ? 'ok'
            : 'neutral',
        where: where || (type.startsWith('WORKFLOW') ? 'Workflow' : undefined),
        device: deviceText || undefined,
        location: locText || undefined,
        media: [...Object.values(d), ...Object.values(o)].filter(isMedia),
      }
    })
    .filter((e): e is ProviderEvent => !!e)
    .sort((a, b) => b.at - a.at)
}

/** Reshape one raw provider decision. Returns undefined for an error entry. */
export function fromProviderDecision(
  raw: Raw,
  source: ProviderReport['source'],
): ProviderReport | undefined {
  const id = str(raw.session_id)
  if (!id) return undefined
  const idv = first(raw.id_verifications)
  const document = documentOf(idv)
  const chip = chipOf(first(raw.nfc_verifications))
  const liveness = livenessOf(first(raw.liveness_checks))
  const faceMatch = faceMatchOf(first(raw.face_matches))
  const device = deviceOf(first(raw.ip_analyses))
  const contact = obj(raw.contact_details)
  const expected = obj(raw.expected_details)
  const name =
    str(idv?.full_name) ??
    ([str(expected.first_name), str(expected.last_name)]
      .filter(Boolean)
      .join(' ') ||
      'Name not yet read')
  const status = str(raw.status) ?? 'In Progress'
  return {
    id,
    number: num(raw.session_number),
    source,
    status: titleCase(status),
    result: resultOf(status),
    createdAt: str(raw.created_at),
    reference: str(raw.vendor_data),
    workflow: str(raw.workflow_type) ?? str(raw.workflow_id),
    name,
    contact: fields(
      field('Email', contact.email),
      field('Phone', contact.phone),
    ),
    document,
    chip,
    liveness,
    faceMatch,
    device,
    events: eventsOf(raw.events),
    flags: [
      ...(document?.flags ?? []),
      ...(chip?.flags ?? []),
      ...(liveness?.flags ?? []),
      ...(faceMatch?.flags ?? []),
      ...(device?.flags ?? []),
    ],
  }
}
