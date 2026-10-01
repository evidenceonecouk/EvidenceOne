import type { DecisionOutcome } from '@/types/domain'

export interface ReasonCode {
  code: string
  outcome: DecisionOutcome
  label: string
}

/* Reason codes recorded with every reviewer decision. */
export const reasonCodes: ReasonCode[] = [
  {
    code: 'APR-01',
    outcome: 'approve',
    label: 'Identity verified to the required standard',
  },
  {
    code: 'RFI-01',
    outcome: 'request_info',
    label: 'Further identity document needed',
  },
  {
    code: 'RFI-02',
    outcome: 'request_info',
    label: 'One supporting document for the current address needed',
  },
  {
    code: 'RFI-03',
    outcome: 'request_info',
    label: 'Evidence of change of name needed',
  },
  {
    code: 'DCL-01',
    outcome: 'decline',
    label: 'No unexpired qualifying identity document provided',
  },
  {
    code: 'DCL-02',
    outcome: 'decline',
    label: 'Address history could not be confirmed',
  },
  {
    code: 'DCL-03',
    outcome: 'decline',
    label: 'Reviewer not satisfied the person is who they claim to be',
  },
]

/** Message shown to the individual when an ACSP declines, exactly as worded by the client. */
export const DECLINE_MESSAGE =
  "Rejection reason: It is the person's responsibility to prove that you are who you say you are. You will need to get documents to be able to verify your identity for Companies House."

/** Message shown when the individual stops because the register already shows them as verified. */
export const ALREADY_VERIFIED_MESSAGE =
  'Companies House already shows your identity as verified. You may not need to do this.'
