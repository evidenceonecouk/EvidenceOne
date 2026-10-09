import type { DemoData, OnboardingApplication } from '@/types/domain'
import type { ActionResult } from './actions'
import { submitApplication } from './onboardingActions'

/*
  Referral Partner actions that are not part of sending invites. Every action
  returns an ActionResult, so it is chained into the audit trail.
*/

/** Answers by section, as structured typed fields. Never a free-text blob. */
export type PartnerAnswers = OnboardingApplication['answers']

/**
  Submit "Join as a Referral Partner". The application waits for a Platform
  Administrator: "Pending platform approval". Joining as a Referral Partner does
  not make the firm an ACSP, and the two roles never merge.
*/
export function submitPartnerApplication(
  data: DemoData,
  input: { name: string; answers: PartnerAnswers; actor: string },
): ActionResult & { applicationId: string } {
  return submitApplication(
    data,
    { kind: 'partner', name: input.name, answers: input.answers },
    input.actor,
  )
}
