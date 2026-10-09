import type { CaseSource, VerificationCase } from '@/types/domain'

/*
  The one source for the attribution wording. Evidence One prepares, evidences
  and records. It never verifies: the ACSP does, and the ACSP stays fully
  responsible. Evidence One is the ACSP's technology provider.
*/

/** Said to the individual. */
export function attributionText(acspName?: string): string {
  return acspName
    ? `Your identity verification is being conducted by ${acspName} using the Evidence One platform.`
    : 'Your identity verification is conducted by an Authorised Corporate Service Provider (ACSP) using the Evidence One platform.'
}

/** Said on the ACSP's own screens and on the record. */
export function technologyProviderText(acspName: string): string {
  return `Evidence One is ${acspName}'s technology provider.`
}

/** Past tense, for the verification record. */
export function recordAttribution(personName: string, acspName: string) {
  return `The identity verification of ${personName} was conducted by ${acspName} using the Evidence One platform. ${technologyProviderText(acspName)}`
}

export const sourceLabel: Record<CaseSource, string> = {
  referred: 'Referred',
  b2c: 'B2C',
  own_client: 'Own client',
}

/** Where the case came from, for the queue, the case header and the record. */
export function sourceDetail(
  vc: Pick<VerificationCase, 'source'>,
  partnerName?: string,
): string {
  switch (vc.source) {
    case 'b2c':
      return 'Direct client of the platform'
    case 'own_client':
      return 'Your own client'
    default:
      return partnerName ? `Referred by ${partnerName}` : 'Referred'
  }
}

/** How the ACSP was chosen. */
export function allocationLabel(
  vc: Pick<VerificationCase, 'allocation' | 'source'>,
): string {
  switch (vc.allocation?.source) {
    case 'suggested':
      return 'Suggested to the client, chosen by them'
    case 'administrator':
      return 'Allocated, confirmed by an administrator'
    default:
      return vc.source === 'own_client'
        ? 'Your own invite'
        : 'Named in the invite'
  }
}
