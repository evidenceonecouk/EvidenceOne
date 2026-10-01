import type { DemoData, RegisterRole } from '@/types/domain'
import { formatAddress } from './format'

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
  nationality?: string
  dobMonthYear?: string
  natureOfControl?: string
  /** Present for fictional demo people only. */
  personId?: string
}

export interface CompanyProfile extends CompanySummary {
  type?: string
  sicDescription?: string
  people: RegisterPerson[]
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
  return {
    number: c.number,
    name: c.name,
    status: c.status,
    incorporatedOn: c.incorporatedOn,
    address: formatAddress(c.registeredOffice),
    type: 'Private limited company',
    sicDescription: `${c.sicCodes[0]} · ${c.sicDescription}`,
    source: 'demo',
    people: data.register
      .filter((r) => r.companyNumber === number)
      .map((r) => ({
        name: r.registerName,
        role: r.role,
        roleLabel: roleLabels[r.role],
        appointedOn: r.appointedOn,
        nationality: data.people.find((p) => p.id === r.personId)?.nationality,
        dobMonthYear: r.registerDobMonthYear,
        natureOfControl: r.natureOfControl,
        personId: r.personId,
      })),
  }
}

type Json = Record<string, unknown>

export async function liveProfile(number: string): Promise<CompanyProfile | null> {
  try {
    const res = await fetch(`/api/companies/profile?number=${encodeURIComponent(number)}`)
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    const { profile, officers, pscs } = (await res.json()) as { profile: Json; officers: { items?: Json[] }; pscs: { items?: Json[] } }
    const dob = (d: unknown) => {
      const v = d as { month?: number; year?: number } | undefined
      return v?.month && v?.year ? `${MONTHS[v.month - 1]} ${v.year}` : undefined
    }
    const people: RegisterPerson[] = [
      ...(officers.items ?? [])
        .filter((o) => !o.resigned_on)
        .map((o) => {
          const role = String(o.officer_role ?? '')
          const isDirector = role.includes('director')
          return {
            name: String(o.name),
            role: isDirector ? ('director' as const) : role === 'secretary' ? ('secretary' as const) : ('other' as const),
            roleLabel: role ? role.replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase()) : 'Officer',
            appointedOn: o.appointed_on as string | undefined,
            nationality: o.nationality as string | undefined,
            dobMonthYear: dob(o.date_of_birth),
          }
        }),
      ...(pscs.items ?? [])
        .filter((p) => !p.ceased_on)
        .map((p) => ({
          name: String(p.name),
          role: 'psc' as const,
          roleLabel: 'Person with significant control',
          appointedOn: p.notified_on as string | undefined,
          nationality: p.nationality as string | undefined,
          dobMonthYear: dob(p.date_of_birth),
          natureOfControl: ((p.natures_of_control as string[] | undefined) ?? []).map((n) => n.replace(/-/g, ' ')).join('; '),
        })),
    ]
    const addr = profile.registered_office_address as Record<string, string> | undefined
    return {
      number: String(profile.company_number),
      name: String(profile.company_name),
      status: String(profile.company_status ?? 'unknown'),
      incorporatedOn: profile.date_of_creation as string | undefined,
      address: addr ? [addr.address_line_1, addr.address_line_2, addr.locality, addr.postal_code].filter(Boolean).join(', ') : undefined,
      type: String(profile.type ?? '').toUpperCase(),
      sicDescription: ((profile.sic_codes as string[] | undefined) ?? []).join(', '),
      source: 'live',
      people,
    }
  } catch {
    return null
  }
}
