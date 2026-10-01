import type { DecisionOutcome } from '@/types/domain'

export interface ReasonCode {
  code: string
  outcome: DecisionOutcome
  label: string
}

/* Reason codes recorded with every reviewer decision. */
export const reasonCodes: ReasonCode[] = [
  { code: 'APR-01', outcome: 'approve', label: 'Identity verified to the required standard' },
  { code: 'RFI-01', outcome: 'request_info', label: 'Further identity document needed' },
  { code: 'RFI-02', outcome: 'request_info', label: 'Current-address evidence needed, dated within 3 months' },
  { code: 'RFI-03', outcome: 'request_info', label: 'Evidence of change of name needed' },
  { code: 'DEC-01', outcome: 'decline', label: 'No unexpired qualifying identity document provided' },
  { code: 'DEC-02', outcome: 'decline', label: 'Address history could not be confirmed' },
  { code: 'DEC-03', outcome: 'decline', label: 'Reviewer not satisfied the person is who they claim to be' },
]

/** Message shown to the individual when an ACSP declines, as worded by the client. */
export const DECLINE_MESSAGE =
  'It is the person’s responsibility to prove that you are who you say you are. You will need to get documents to be able to verify your identity for Companies House.'
