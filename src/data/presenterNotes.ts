/*
  Presenter-only notes for the identity provider journey. Never shown on a
  client-facing screen. The provider is never named.
*/
export const identityPresenterNotes: { title: string; body: string }[] = [
  {
    title: 'Return to our page after the check',
    body: 'Whether the certified identity provider returns the person to the Evidence One page after its journey is still to be confirmed with the provider. The return shown in the demo is a simulated placeholder.',
  },
  {
    title: 'Where the chip step sits',
    body: 'The demo places the chip step straight after the document capture, inside the provider journey. The exact position is still to be confirmed with the provider.',
  },
  {
    title: 'eVisa holders',
    body: 'The certified identity provider checks an eVisa directly with the Home Office (provider answer of 23 October). An eVisa is an accepted Option 1 document on the same route.',
  },
  {
    title: 'Core identity branch and optional checks',
    body: 'The core identity branch is document validation, face match, liveness and the chip read where the document has a chip. It is separate from the optional address check and the PEP and sanctions screening, which each ACSP switches on or off. The client asked the provider for exactly this split on 23 October.',
  },
  {
    title: 'Document lists are data',
    body: 'The Option 1, Option 2 Group A and Option 2 Group B lists live in the rule set, not in the screens. A Companies House change is a draft version with a second approver. Group A and Group B are Option 2 classifications only. Every expiry allowance is 0 and the setting that would apply one is off: expired passports are not accepted (H1) until the client decides, after the provider replies.',
  },
  {
    title: 'No smartphone or tablet',
    body: 'A person without a smartphone or tablet is offered the Option 2 route, handled through the identity provider’s manual document review, with the ACSP completing any further checks and deciding. This is subject to the provider confirming it can. Raised with the provider by the client on 22 and 23 October; the answer was awaited on 26 October.',
  },
  {
    title: 'Chip not read',
    body: 'Companies House replied on 13 October that no technology or NFC is mandated, and the client determined that the ACSP decides. The demo records "No chip read" and gives the reviewer a Flag and a Mandatory decision. This is a design interpretation; the wording is to be confirmed with the client.',
  },
]

/** Presenter-only notes on payments, messages and register corrections. Never shown on a client-facing screen. */
export const platformPresenterNotes: { title: string; body: string }[] = [
  {
    title: 'How payments are taken (client answers of 23 October)',
    body: 'The secure payment provider takes the payments as direct charges to the ACSP’s connected account, with an application fee for the platform fee. Subscriptions are taken through the provider’s billing on the Evidence One account. The provider is kept generic on every screen. Nothing in the demo holds a bank detail.',
  },
  {
    title: 'Connect payments, two gates',
    body: 'Payments activate only when the provider shows the ACSP as Eligible and Evidence One has approved it. The client wrote that this is subject to the payment provider’s confirmation, so the step carries a Subject to payment provider confirmation badge, distinct from Pending your decision. Excluding an ACSP without active payments from allocation and referral matching (MATCH-09) is a design proposal the client has not decided.',
  },
  {
    title: 'Messages carry no codes',
    body: 'The client withdrew code sharing through messages from Gate 2 on 23 October. The messaging notice is always shown. Text that looks like a code is not sent until the person edits it, and the flagged text is not saved. That is a design interpretation of “does not intentionally store”: confirm the wording, and whether blocking is right, with the client.',
  },
  {
    title: 'Register correction with a fee: design interpretations',
    body: 'Correction needed is an outcome of the Mandatory decision, not a Halt, a Block or a fourth reviewer action. To confirm with the client: who carries out the correction and by which route (the demo has the ACSP do it outside the platform, because Route B filing is the held option O2); who pays the add-on under an Agent Payment Code (shown as the client, Pending your decision); the Referral Partner status mapping (Further information required, then In progress); the second authorisation for the revised total; and one £69 per case, not per correction.',
  },
  {
    title:
      'Expired and non-biometric passports, optional checks and PEP pricing',
    body: 'Held for the identity provider’s answers (G2-08 and G2-09). Expired passports are not accepted (H1, decided 19 October) and every expiry allowance is 0 until the client decides. The affected settings carry a Subject to provider confirmation badge.',
  },
]
