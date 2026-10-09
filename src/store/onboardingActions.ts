import type { DemoData, OnboardingApplication } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Join as a Referral Partner or as an ACSP. Both end in "Pending platform
  approval": a Platform Administrator approves every ACSP and every Referral
  Partner before it goes live (see the ADMIN workstream's approveApplication).
*/

export function submitApplication(
  data: DemoData,
  input: Pick<OnboardingApplication, 'kind' | 'name' | 'answers'>,
  actor: string,
): ActionResult & { applicationId: string } {
  const at = new Date().toISOString()
  const prefix = input.kind === 'acsp' ? 'APP-ACSP-' : 'APP-RP-'
  const n =
    data.applications.filter((a) => a.id.startsWith(prefix)).length + 101
  const applicationId = `${prefix}2026-${String(n).padStart(4, '0')}`
  return {
    applicationId,
    data: {
      ...data,
      applications: [
        ...data.applications,
        {
          id: applicationId,
          kind: input.kind,
          name: input.name,
          submittedAt: at,
          status: 'pending_approval',
          answers: input.answers,
        },
      ],
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action:
          input.kind === 'acsp'
            ? 'onboarding.acsp_submitted'
            : 'onboarding.partner_submitted',
        detail: `${input.name} submitted an application to join as ${input.kind === 'acsp' ? 'an ACSP' : 'a Referral Partner'}. Reference ${applicationId}. Pending platform approval.`,
      },
    ],
  }
}
