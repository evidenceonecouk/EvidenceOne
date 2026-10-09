import {
  Briefcase,
  Building2,
  ScanFace,
  Settings2,
  UserCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
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
    id: 'partner',
    label: 'Referral Partner',
    shortLabel: 'Partner',
    description:
      'Accountants, law firms, corporate service providers and introducers who bring client companies to the platform. They see status and check results only.',
    home: '/partner',
    areas: ['/partner'],
    icon: Briefcase,
  },
  {
    id: 'reviewer',
    label: 'ACSP',
    shortLabel: 'ACSP',
    description:
      'The registered ACSP: ACSP Reviewers approve, request information or decline. The ACSP Administrator manages the firm.',
    home: '/acsp/queue',
    areas: ['/acsp', '/records'],
    icon: Building2,
  },
  {
    id: 'individual',
    label: 'Individual',
    shortLabel: 'Individual',
    description:
      'A director or PSC who has been invited to verify their identity in the browser.',
    home: '/journey/EO-2026-000135/invite',
    areas: ['/journey'],
    icon: ScanFace,
  },
  {
    id: 'b2c',
    label: 'B2C client',
    shortLabel: 'B2C',
    description:
      'A member of the public who comes to Evidence One directly, is suggested ACSPs and is allocated to one.',
    home: '/verify',
    areas: ['/verify'],
    icon: UserRound,
  },
  {
    id: 'platformAdmin',
    label: 'Platform Administrator',
    shortLabel: 'Platform Admin',
    description:
      'Approves ACSPs and Referral Partners, manages allocation and monitoring, and reads platform events. Cannot approve a case or read identity evidence.',
    home: '/admin',
    areas: ['/admin'],
    icon: Settings2,
  },
  {
    id: 'superAdmin',
    label: 'Super Administrator',
    shortLabel: 'Super Admin',
    description:
      'Sets the platform fee and subscription plans, switches referral commissions on, and publishes rule sets, each with a second approver.',
    home: '/super',
    areas: ['/super'],
    icon: UserCheck,
  },
]

/** Screens every professional persona can open, such as the Rules page. They keep the current persona. */
export const sharedAreas = [
  '/rules',
  '/admin/fees',
  '/admin/commissions',
  '/admin/audit',
]
export const isSharedPath = (pathname: string) =>
  sharedAreas.some((a) => pathname === a || pathname.startsWith(`${a}/`))

export const personaById = (id: PersonaId) => personas.find((p) => p.id === id)!

export function personaForPath(pathname: string): PersonaId | undefined {
  return personas.find((p) =>
    p.areas.some((a) => pathname === a || pathname.startsWith(`${a}/`)),
  )?.id
}
