import type { DemoData, RegisterRole } from '@/types/domain'
import { registerDetails } from '@/data/registerDetails'
import { formatAddress, formatDate } from './format'

/*
  Companies House register access. Live public data comes through the server
  proxies in /api; when they are unavailable (local development, missing key,
  rate limits) the demo falls back to its fictional companies.
*/

export interface CompanySummary {
  number: string
  name: string
  status: string
  incorporatedOn?: string
  address?: string
  source: 'live' | 'demo'
}

export interface RegisterPerson {
  name: string
  role: RegisterRole | 'secretary' | 'other'
  roleLabel: string
  appointedOn?: string
  resignedOn?: string
  nationality?: string
  dobMonthYear?: string
  occupation?: string
  countryOfResidence?: string
  natureOfControl?: string
  /** Identity verification as shown on the register, where it says. */
  identityVerifiedOn?: string
  identityVerified?: boolean
  /** Present for fictional demo people only. */
  personId?: string
}

export interface FilingDeadline {
  lastMadeUpTo?: string
  nextMadeUpTo?: string
  nextDue?: string
  overdue?: boolean
}

export interface FilingItem {
  date: string
  type: string
  category: string
  description: string
}

export interface CompanyProfile extends CompanySummary {
  type?: string
  jurisdiction?: string
  sic: { code: string; description?: string }[]
  accounts?: FilingDeadline & { lastType?: string; reference?: string }
  confirmationStatement?: FilingDeadline
  previousNames: { name: string; from: string; to: string }[]
  hasCharges?: boolean
  hasInsolvencyHistory?: boolean
  officeInDispute?: boolean
  undeliverableAddress?: boolean
  filings: FilingItem[]
  /** Current officers and PSCs. A director who is also a PSC appears once. */
  people: RegisterPerson[]
  resigned: RegisterPerson[]
}

/** Common SIC 2007 codes, so live companies show a description rather than a bare number. */
const SIC: Record<string, string> = {
  '01110': 'Growing of cereals and other crops',
  '10710': 'Manufacture of bread; fresh pastry goods and cakes',
  '33150': 'Repair and maintenance of ships and boats',
  '41100': 'Development of building projects',
  '41201': 'Construction of commercial buildings',
  '41202': 'Construction of domestic buildings',
  '43999': 'Other specialised construction activities',
  '45111': 'Sale of new cars and light motor vehicles',
  '46900': 'Non-specialised wholesale trade',
  '47110': 'Retail sale in non-specialised stores with food, beverages or tobacco predominating',
  '47190': 'Other retail sale in non-specialised stores',
  '47910': 'Retail sale via mail order houses or via Internet',
  '49410': 'Freight transport by road',
  '55100': 'Hotels and similar accommodation',
  '56101': 'Licensed restaurants',
  '56102': 'Unlicensed restaurants and cafes',
  '56210': 'Event catering activities',
  '56302': 'Public houses and bars',
  '58290': 'Other software publishing',
  '62011': 'Ready-made interactive leisure and entertainment software development',
  '62012': 'Business and domestic software development',
  '62020': 'Information technology consultancy activities',
  '62090': 'Other information technology service activities',
  '63110': 'Data processing, hosting and related activities',
  '64191': 'Banks',
  '64205': 'Activities of financial services holding companies',
  '64209': 'Activities of other holding companies not elsewhere classified',
  '64999': 'Financial intermediation not elsewhere classified',
  '66190': 'Activities auxiliary to financial intermediation not elsewhere classified',
  '68100': 'Buying and selling of own real estate',
  '68209': 'Other letting and operating of own or leased real estate',
  '68320': 'Management of real estate on a fee or contract basis',
  '69101': 'Barristers at law',
  '69102': 'Solicitors',
  '69109': 'Activities of patent and copyright agents; other legal activities',
  '69201': 'Accounting and auditing activities',
  '69202': 'Bookkeeping activities',
  '69203': 'Tax consultancy',
  '70100': 'Activities of head offices',
  '70229': 'Management consultancy activities other than financial management',
  '71111': 'Architectural activities',
  '71129': 'Other engineering activities',
  '73110': 'Advertising agencies',
  '74100': 'Specialised design activities',
  '74909': 'Other professional, scientific and technical activities',
  '82990': 'Other business support service activities',
  '85590': 'Other education',
  '86900': 'Other human health activities',
  '96090': 'Other service activities',
  '99999': 'Dormant company',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function demoSearch(data: DemoData, q: string): CompanySummary[] {
  const term = q.trim().toLowerCase()
  if (!term) return []
  return data.companies
    .filter((c) => c.name.toLowerCase().includes(term) || c.number.includes(term))
    .map((c) => ({
      number: c.number,
      name: c.name,
      status: c.status,
      incorporatedOn: c.incorporatedOn,
      address: formatAddress(c.registeredOffice),
      source: 'demo' as const,
    }))
}

export async function liveSearch(q: string, signal?: AbortSignal): Promise<CompanySummary[] | null> {
  try {
    const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`, { signal })
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    const body = (await res.json()) as { items?: Array<Record<string, string>> }
    return (body.items ?? []).map((i) => ({
      number: i.company_number,
      name: i.title,
      status: i.company_status ?? 'unknown',
      incorporatedOn: i.date_of_creation,
      address: i.address_snippet,
      source: 'live' as const,
    }))
  } catch {
    return null
  }
}

const roleLabels: Record<RegisterRole, string> = {
  director: 'Director',
  psc: 'Person with significant control',
  director_psc: 'Director and PSC',
}

export function demoProfile(data: DemoData, number: string): CompanyProfile | null {
  const c = data.companies.find((x) => x.number === number)
  if (!c) return null
  const d = registerDetails[number]
  const now = Date.now()
  const deadline = <T extends { nextDue?: string }>(x: T | undefined) => x && { ...x, overdue: !!x.nextDue && new Date(x.nextDue).getTime() < now }
  return {
    number: c.number,
    name: c.name,
    status: c.status,
    incorporatedOn: c.incorporatedOn,
    address: formatAddress(c.registeredOffice),
    type: c.type === 'plc' ? 'Public limited company' : c.type === 'llp' ? 'Limited liability partnership' : 'Private limited company',
    jurisdiction: 'England and Wales',
    sic: c.sicCodes.map((code, i) => ({ code, description: i === 0 ? c.sicDescription : SIC[code] })),
    accounts: d && { ...deadline(d.accounts)!, reference: `${d.accountingReference.day} ${MONTHS[d.accountingReference.month - 1]}` },
    confirmationStatement: deadline(d?.confirmationStatement),
    previousNames: d?.previousNames ?? [],
    hasCharges: d?.hasCharges ?? false,
    hasInsolvencyHistory: false,
    officeInDispute: false,
    undeliverableAddress: false,
    filings: d?.filings ?? [],
    source: 'demo',
    people: data.register
      .filter((r) => r.companyNumber === number)
      .map((r) => ({
        name: r.registerName,
        role: r.role,
        roleLabel: roleLabels[r.role],
        appointedOn: r.appointedOn,
        nationality: r.registerNationality,
        dobMonthYear: r.registerDobMonthYear,
        occupation: d?.officers[r.personId]?.occupation,
        countryOfResidence: d?.officers[r.personId]?.countryOfResidence,
        natureOfControl: r.natureOfControl,
        identityVerified: !!r.identityVerified,
        personId: r.personId,
      })),
    resigned: (d?.resigned ?? []).map((r) => ({ ...r, role: 'director' as const })),
  }
}

type Json = Record<string, unknown>

const humanise = (v: unknown) => String(v ?? '').replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase())

const FILING_CATEGORIES: Record<string, string> = {
  'confirmation-statement': 'Confirmation statement',
  accounts: 'Accounts',
  officers: 'Officers',
  'persons-with-significant-control': 'Persons with significant control',
  address: 'Address',
  capital: 'Capital',
  mortgage: 'Mortgage',
  incorporation: 'Incorporation',
  'change-of-name': 'Change of name',
  resolution: 'Resolution',
  'annual-return': 'Annual return',
}

/** Filing descriptions come back as keys; turn the common ones into plain sentences. */
function describeFiling(f: Json): string {
  const key = String(f.description ?? '')
  const v = (f.description_values ?? {}) as Record<string, string>
  const date = (x?: string) => (x ? formatDate(x) : '')
  switch (key) {
    case 'confirmation-statement-with-no-updates':
      return `Confirmation statement made on ${date(v.made_up_date)} with no updates`
    case 'confirmation-statement-with-updates':
      return `Confirmation statement made on ${date(v.made_up_date)} with updates`
    case 'accounts-with-accounts-type-full':
    case 'accounts-with-accounts-type-group':
    case 'accounts-with-accounts-type-small':
    case 'accounts-with-accounts-type-micro-entity':
    case 'accounts-with-accounts-type-total-exemption-full':
    case 'accounts-with-accounts-type-dormant':
      return `${humanise(key.replace('accounts-with-accounts-type-', ''))} accounts made up to ${date(v.made_up_date)}`
    case 'appoint-person-director-company-with-name-date':
      return `Appointment of ${v.officer_name} as a director on ${date(v.appointment_date)}`
    case 'termination-director-company-with-name-termination-date':
      return `Termination of appointment of ${v.officer_name} as a director on ${date(v.termination_date)}`
    case 'change-person-director-company-with-change-date':
      return `Director's details changed for ${v.officer_name} on ${date(v.change_date)}`
    case 'change-registered-office-address-company-with-date-old-address-new-address':
      return `Registered office address changed from ${v.old_address} to ${v.new_address}`
    case 'notification-of-a-person-with-significant-control':
      return `Notification of ${v.psc_name} as a person with significant control`
    case 'capital-allotment-shares':
      return `Statement of capital following an allotment of shares on ${date(v.date)}`
    default:
      return humanise(key.replace(/-with-.*$/, '')) || 'Filing'
  }
}

export async function liveProfile(number: string): Promise<CompanyProfile | null> {
  try {
    const res = await fetch(`/api/companies/profile?number=${encodeURIComponent(number)}`)
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    const { profile, officers, pscs, filings } = (await res.json()) as {
      profile: Json
      officers: { items?: Json[] }
      pscs: { items?: Json[] }
      filings?: { items?: Json[] }
    }
    const dob = (d: unknown) => {
      const v = d as { month?: number; year?: number } | undefined
      return v?.month && v?.year ? `${MONTHS[v.month - 1]} ${v.year}` : undefined
    }
    const officer = (o: Json): RegisterPerson => {
      const role = String(o.officer_role ?? '')
      const idv = o.identity_verification_details as Record<string, string> | undefined
      return {
        name: String(o.name),
        role: role.includes('director') ? 'director' : role === 'secretary' ? 'secretary' : 'other',
        roleLabel: role ? humanise(role) : 'Officer',
        appointedOn: o.appointed_on as string | undefined,
        resignedOn: o.resigned_on as string | undefined,
        nationality: o.nationality as string | undefined,
        dobMonthYear: dob(o.date_of_birth),
        occupation: o.occupation as string | undefined,
        countryOfResidence: o.country_of_residence as string | undefined,
        identityVerifiedOn: idv?.identity_verified_on,
        identityVerified: idv ? !!idv.identity_verified_on : undefined,
      }
    }
    const allOfficers = (officers.items ?? []).map(officer)
    const people: RegisterPerson[] = [
      ...allOfficers.filter((o) => !o.resignedOn),
      ...(pscs.items ?? [])
        .filter((p) => !p.ceased_on)
        .map((p) => ({
          name: String(p.name),
          role: 'psc' as const,
          roleLabel: String(p.kind ?? '').includes('corporate') ? 'Corporate PSC' : 'Person with significant control',
          appointedOn: p.notified_on as string | undefined,
          nationality: p.nationality as string | undefined,
          dobMonthYear: dob(p.date_of_birth),
          countryOfResidence: p.country_of_residence as string | undefined,
          natureOfControl: ((p.natures_of_control as string[] | undefined) ?? []).map(controlLabel).join('; '),
        })),
    ]
    const addr = profile.registered_office_address as Record<string, string> | undefined
    const acc = profile.accounts as { next_due?: string; next_made_up_to?: string; overdue?: boolean; last_accounts?: { made_up_to?: string; type?: string }; accounting_reference_date?: { day?: string; month?: string } } | undefined
    const cs = profile.confirmation_statement as { next_due?: string; next_made_up_to?: string; last_made_up_to?: string; overdue?: boolean } | undefined
    const ard = acc?.accounting_reference_date
    return {
      number: String(profile.company_number),
      name: String(profile.company_name),
      status: humanise(profile.company_status ?? 'unknown').toLowerCase(),
      incorporatedOn: profile.date_of_creation as string | undefined,
      address: addr ? [addr.premises, addr.address_line_1, addr.address_line_2, addr.locality, addr.region, addr.postal_code, addr.country].filter(Boolean).join(', ') : undefined,
      type: COMPANY_TYPES[String(profile.type)] ?? humanise(profile.type),
      jurisdiction: humanise(profile.jurisdiction).replace(/\bwales\b/i, 'Wales'),
      sic: ((profile.sic_codes as string[] | undefined) ?? []).map((code) => ({ code, description: SIC[code] })),
      accounts: acc && {
        lastMadeUpTo: acc.last_accounts?.made_up_to,
        lastType: acc.last_accounts?.type && humanise(acc.last_accounts.type),
        nextMadeUpTo: acc.next_made_up_to,
        nextDue: acc.next_due,
        overdue: acc.overdue,
        reference: ard?.day && ard.month ? `${Number(ard.day)} ${MONTHS[Number(ard.month) - 1]}` : undefined,
      },
      confirmationStatement: cs && { lastMadeUpTo: cs.last_made_up_to, nextMadeUpTo: cs.next_made_up_to, nextDue: cs.next_due, overdue: cs.overdue },
      previousNames: ((profile.previous_company_names as Json[] | undefined) ?? []).map((n) => ({ name: String(n.name), from: String(n.effective_from), to: String(n.ceased_on) })),
      hasCharges: !!profile.has_charges,
      hasInsolvencyHistory: !!profile.has_insolvency_history,
      officeInDispute: !!profile.registered_office_is_in_dispute,
      undeliverableAddress: !!profile.undeliverable_registered_office_address,
      filings: (filings?.items ?? []).map((f) => ({
        date: String(f.date),
        type: String(f.type ?? ''),
        category: FILING_CATEGORIES[String(f.category)] ?? humanise(f.category),
        description: describeFiling(f),
      })),
      source: 'live',
      people,
      resigned: allOfficers.filter((o) => o.resignedOn),
    }
  } catch {
    return null
  }
}

const COMPANY_TYPES: Record<string, string> = {
  ltd: 'Private limited company',
  plc: 'Public limited company',
  llp: 'Limited liability partnership',
  'private-unlimited': 'Private unlimited company',
  'private-limited-guarant-nsc': 'Private company limited by guarantee',
  'private-limited-guarant-nsc-limited-exemption': 'Private company limited by guarantee',
  'limited-partnership': 'Limited partnership',
  'scottish-partnership': 'Scottish partnership',
  'registered-society-non-jurisdictional': 'Registered society',
  'royal-charter': 'Royal charter company',
  'oversea-company': 'Overseas company',
}

/** Nature of control keys, read as the register describes them. */
function controlLabel(key: string): string {
  const band = key.match(/(25-to-50|50-to-75|75-to-100)-percent/)?.[1]
  const bands: Record<string, string> = {
    '25-to-50': 'more than 25% but not more than 50%',
    '50-to-75': 'more than 50% but less than 75%',
    '75-to-100': '75% or more',
  }
  if (key.startsWith('ownership-of-shares') && band) return `Ownership of shares: ${bands[band]}`
  if (key.startsWith('voting-rights') && band) return `Voting rights: ${bands[band]}`
  if (key.startsWith('right-to-appoint-and-remove-directors')) return 'Right to appoint and remove directors'
  if (key.startsWith('significant-influence-or-control')) return 'Significant influence or control'
  return humanise(key)
}
