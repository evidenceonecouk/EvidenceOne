import type {
  AdditionalCheck,
  Option2State,
  ProviderFindings,
} from '@/types/domain'

/*
  Option 2 through the identity provider's manual document review (G2-14,
  client email of 23 October). Subject to the provider confirming it can meet
  the Companies House requirements. The provider's trained reviewers do the
  supported document checks and return findings. The assigned ACSP completes
  any additional checks and keeps the final decision, as in Option 1.
  Whether this replaces an ACSP-run trained check is still open.
*/

export const OPTION2_PROVIDER_LINE =
  'The certified identity provider’s trained reviewers check your documents.'

export const option2IndividualLine = (acspName: string) =>
  `${OPTION2_PROVIDER_LINE} ${acspName} completes any further checks and makes the decision.`

export const OPTION2_ACSP_LINE =
  'The certified identity provider’s trained reviewers check the documents and return findings. You complete any additional checks and keep the final decision.'

export const newAdditionalChecks = (): AdditionalCheck[] => [
  {
    id: 'ac-findings',
    label:
      'I have read the identity provider’s findings and the documents it checked',
    done: false,
  },
  {
    id: 'ac-register',
    label:
      'I have compared the person’s details with the Companies House register',
    done: false,
  },
  {
    id: 'ac-uncheck',
    label: 'I have dealt with anything the provider could not check',
    done: false,
  },
  {
    id: 'ac-consistent',
    label: 'The name, date of birth and nationality agree across the documents',
    done: false,
  },
]

/** Simulated findings the provider returns once its manual review is done. */
export function simulatedFindings(at: string): ProviderFindings {
  return {
    returnedAt: at,
    checks: [
      {
        label: 'Document authenticity and security features',
        outcome: 'passed',
      },
      { label: 'Document not damaged or tampered with', outcome: 'passed' },
      {
        label: 'Name and date of birth read from the documents',
        outcome: 'passed',
      },
      {
        label: 'Photograph compared with the second document',
        outcome: 'flagged',
        note: 'Image quality on the second document was low. A reviewer judged it a probable match.',
      },
    ],
    couldNotCheck: [
      'Current residential address (not shown on the documents)',
      'Match with the Companies House register',
    ],
  }
}

export const additionalChecksComplete = (o?: Option2State) =>
  !!o?.providerFindings &&
  !!o.additionalChecks?.length &&
  o.additionalChecks.every((c) => c.done) &&
  !!o.additionalReason?.trim()
