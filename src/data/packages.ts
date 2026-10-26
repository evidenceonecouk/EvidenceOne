import type { PackageId, SubscriptionPackage } from '@/types/domain'

/*
  Provisional subscription packages for an ACSP's own clients (client email of
  15 October). Every value is a setting, changed only by a Super Administrator
  with a second approver. The client confirms the final price and structure
  before go-live. Referred cases sit outside the allowance: the £69 platform
  fee covers them. The cost of the identity checks is never shown to the ACSP.
*/

export const PACKAGES_PROVISIONAL_NOTE =
  'Provisional. The client confirms the final price and structure before go-live.'

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'easy',
    name: 'Easy',
    monthlyPrice: 29,
    casesIncluded: 5,
    filesPerCase: 5,
    maxFileMb: 10,
    storageGb: 2,
    extraCaseFee: 5,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 89,
    casesIncluded: 25,
    filesPerCase: 5,
    maxFileMb: 10,
    storageGb: 10,
    extraCaseFee: 5,
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 199,
    casesIncluded: 60,
    filesPerCase: 5,
    maxFileMb: 10,
    storageGb: 25,
    extraCaseFee: 5,
  },
]

/** What every package includes, as listed in the client's email. */
export const PACKAGE_INCLUDES = [
  'Workflow and compliance infrastructure',
  'Audit trail',
  'Storage, kept for seven years',
  'Case management',
  'Companies House-related functionality',
]

/** The plan an ACSP starts on before it chooses a package: no subscription, referred cases only. */
export function seedPlan(acspId: string, invoiceMode: 'per_case' | 'monthly') {
  const seed = SEED_ACSP_PACKAGES[acspId]
  return {
    invoiceMode,
    packageId: seed?.packageId ?? null,
    usageBaseline: seed?.usageBaseline ?? {
      ownClientCases: 0,
      referredCases: 0,
    },
    storageUsedGb: seed?.storageUsedGb ?? 0,
  }
}

/** Seeded package per ACSP. Null means no subscription: referred cases only. */
export const SEED_ACSP_PACKAGES: Record<
  string,
  {
    packageId: PackageId | null
    usageBaseline: { ownClientCases: number; referredCases: number }
    storageUsedGb: number
  }
> = {
  'acsp-harcourt': {
    packageId: 'pro',
    usageBaseline: { ownClientCases: 13, referredCases: 21 },
    storageUsedGb: 6.4,
  },
  'acsp-pellrowe': {
    packageId: 'easy',
    usageBaseline: { ownClientCases: 6, referredCases: 4 },
    storageUsedGb: 1.92,
  },
  'acsp-fenwick': {
    packageId: 'scale',
    usageBaseline: { ownClientCases: 33, referredCases: 9 },
    storageUsedGb: 11.8,
  },
  'acsp-northbank': {
    packageId: null,
    usageBaseline: { ownClientCases: 0, referredCases: 3 },
    storageUsedGb: 0.7,
  },
  'acsp-ashdown': {
    packageId: null,
    usageBaseline: { ownClientCases: 0, referredCases: 2 },
    storageUsedGb: 0.2,
  },
}
