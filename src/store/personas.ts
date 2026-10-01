import { Briefcase, Building2, ScanFace, Settings2, UserRound, type LucideIcon } from 'lucide-react'
import type { PersonaId } from '@/types/domain'

export interface Persona {
  id: PersonaId
  label: string
  shortLabel: string
  description: string
  home: string
  /** Route prefixes that belong to this persona. */
  areas: string[]
  icon: LucideIcon
}

export const personas: Persona[] = [
  {
    id: 'agent',
    label: 'Agent',
    shortLabel: 'Agent',
    description: 'Accountants, law firms, family offices and introducers who bring client companies to the platform.',
    home: '/agent',
    areas: ['/agent'],
    icon: Briefcase,
  },
  {
    id: 'reviewer',
    label: 'ACSP reviewer',
    shortLabel: 'ACSP',
    description: 'The authorised person who reviews the evidence and makes the decision.',
    home: '/acsp/queue',
    areas: ['/acsp', '/records'],
    icon: Building2,
  },
  {
    id: 'individual',
    label: 'Individual',
    shortLabel: 'Individual',
    description: 'A director or PSC who has been invited to verify their identity in the app.',
    home: '/app/EO-2026-000135/invite',
    areas: ['/app'],
    icon: ScanFace,
  },
  {
    id: 'b2c',
    label: 'B2C client',
    shortLabel: 'B2C',
    description: 'A member of the public who comes to Evidence One directly and is allocated to an ACSP.',
    home: '/verify',
    areas: ['/verify'],
    icon: UserRound,
  },
  {
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Platform administration: ACSPs, B2C allocation and remuneration.',
    home: '/admin',
    areas: ['/admin'],
    icon: Settings2,
  },
]

export const personaById = (id: PersonaId) => personas.find((p) => p.id === id)!

export function personaForPath(pathname: string): PersonaId | undefined {
  return personas.find((p) => p.areas.some((a) => pathname === a || pathname.startsWith(`${a}/`)))?.id
}
