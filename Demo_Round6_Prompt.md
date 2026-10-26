Read `CLAUDE.md` in full before doing anything. It was updated on 26 October 2026 and replaces the 23 October version. Start with its section "What changed since 23 October", because it reverses part of what Round 5 built. Its hard rules apply to everything below: synthetic data only, no Evidence One app, the named ACSP is the service provider and Evidence One the technology provider, the platform never verifies, AI is advisory only, no GOV.UK lookalikes, no One Login credentials, the identity provider is never named (always "certified identity provider"), the payment provider is never named (always "secure payment provider"), WCAG 2.2 AA, UK English, no em-dashes, no emojis, no version numbers in UI copy.

This is round 6. Round 5 (`Demo_Round5_Prompt.md`) applied the client's answers up to 22 October. This round applies her Gate 2 amendments email of 23 October (18:18), summarised in `Client_Amendments_2026-10-23.md`. Read that file too. Where Round 5 and this round differ, this round wins. The client has not yet seen the Round 5 demo, so this is the version she will review. Work in small commits and keep `npm run build` passing with zero TypeScript errors before every commit.

## 0. Before you change anything

1. Round 5 is entirely uncommitted in the working tree (the last commit is from 9 October). Run `npm run build`, fix anything that fails, and commit Round 5 as it stands in one commit named "Round 5" before starting. Do not push yet.
2. Survey. Read `src/types/domain.ts`, `src/store/*`, `src/data/*`, `src/lib/rules.ts`, `src/App.tsx` and the feature folders. List every place that:
   - handles code messages: `grep -rn -iE "code message|codeKind|CodeKind|CodeMessageCard|codeWarning|code_message_retention|Fast-forward 30|Show code|Mark code received|ordinaryMessages|isCodeMessage|codeDeleted"`. Known files include `src/components/app/CodeMessageCard.tsx`, `src/lib/codeWarning.ts`, `src/lib/copilot.ts`, `src/store/messageActions.ts`, `src/store/actions.ts`, `src/store/exportActions.ts`, `src/features/acsp/CaseMessages.tsx`, `src/features/acsp/CaseReview.tsx`, `src/features/individual/CaseMessages.tsx`, `src/features/individual/steps/FinishSteps.tsx`, `src/features/records/VerificationRecord.tsx`, `src/features/admin/CompliancePage.tsx`, `src/features/guided/steps.ts`, `src/data/rules.ts`, `src/data/cases.ts`, `src/data/decisions.ts`, `src/types/domain.ts`;
   - says "Group A" for anything other than Option 2 (today `IdentitySteps.tsx`, `CaseSections.tsx`, `src/lib/rules.ts` and `src/data/rules.ts` use it only for Option 2, which is correct; confirm nothing says it for Option 1);
   - describes Option 2 as checked "in person by a trained reviewer" (`src/features/acsp/CaseSections.tsx`, the individual Option 2 request screen);
   - sets up the ACSP payout account (`src/features/onboarding/JoinAcsp.tsx`, `payoutConnected`, `payoutAccountConnected`);
   - handles register differences and the Mandatory decision on them (`src/lib/rules.ts` REG rules, `src/lib/register.ts`, `src/store/reviewActions.ts`), and the existing post-submission `Correction.tsx` (which stays as it is and is a different thing: it corrects a submitted verification).
   Fix everything through the sections below. Do not leave any behind.
3. Bump the persisted store schema version, so stale localStorage from Round 5 cannot reintroduce removed code message data. "Reset demo" must restore everything, including the new state below.

## 1. Remove code messages (reverses P4), restore the warning

The client's 23 October email (G2-12 and G2-18): the messaging facility is for verification-related communication only and must not be used to send Companies House personal codes, company authentication codes, passwords or other credentials. Evidence One does not request, collect or intentionally store them. There is no dedicated code-sharing feature in Gate 2. Secure credential sharing may be added later if ACSPs show a genuine commercial need.

- Delete the code message type end to end: the "Send a Companies House code to [ACSP]" option, `CodeMessageCard.tsx`, "Show code", "Mark code received", the 30 day deletion, the "Fast-forward 30 days" guided action, the `CodeKind` type and any `kind: 'code'` handling, `code_message_retention_days`, and the helpers that filter code messages out of exports, Partner views, administrator views and the Copilot. Remove rather than hide.
- Replace `src/lib/codeWarning.ts` with a small warning helper: `looksLikeCode(text)` and the two strings below. Keep the pattern check conservative.
- Always-visible notice under the message composer, in both the individual view and the ACSP view: "Messages are for questions about the verification. Please do not send Companies House codes, passwords or other access credentials here. Companies House sends the personal code directly to the person."
- If the text looks like a code, show before sending: "This looks like a code. Please do not share it here. Evidence One does not ask for or keep Companies House codes. If [ACSP name] needs a code for a later filing, agree with them how to pass it on outside Evidence One." The message is not sent until the person edits it, and the flagged text is not saved. (Design interpretation of "does not intentionally store". Add it to the presenter notes: confirm wording with the client.)
- Keep the next-day prompt: "Please confirm that the code has arrived from Companies House", Yes and Not yet, never asking for the code. Record the confirmation on the case.
- In the Route A submission workspace and anywhere an ACSP might need a code for a later filing, add one calm line: "If you need a code for a later filing, agree with your client how they pass it to you. Evidence One does not carry or keep it." Keep "Entered by the filer at Companies House" and no input on any form that needs a code.
- Rules: remove the Round 5 code message rule. Restore a case message rule (as in Round 4): messages must not carry Companies House codes or credentials, source code "C, 23 October". Remove the `code_message_retention_days` parameter. SUB rules unchanged (no personal code field anywhere).
- Audit trail: remove the code message events (sent, received, viewed, deleted). Case messages stay logged as before.
- Seed: replace the code message case with an ordinary message exchange. Remove the Round 5 caption and presenter note about code messages.
- Decisions page: P4 moves out of Decided into a new line under "Changed after being decided": "P4 codes through case messages. Decided 19 and 20 October. Reversed by the client on 23 October: not part of Gate 2, and may return later if ACSPs show a genuine commercial need." M7 stays Decided.

## 2. ACSP onboarding: Connect payments (G2-02)

- In the ACSP onboarding commercial step, replace the "Connect a payout account" button with a "Connect payments" panel showing five stages: 1 You register with Evidence One. 2 You connect payments. 3 The secure payment provider collects your business, representative and payout details. 4 The secure payment provider confirms whether your account can receive payments and payouts. 5 Evidence One activates payments once the provider's requirements and Evidence One's own approval are both met.
- Stage 2 opens a simulated provider-hosted screen inside an Evidence One-branded interstitial (the same pattern as the GOV.UK handoff). The simulated screen is generic, shows no real brand, and the demo never has a bank account number, sort code or any bank credential field. State on the panel: "Evidence One does not collect or store your bank account details. You enter them only with the secure payment provider."
- Provider status values: Not started, In progress, More information needed, Eligible. Add them to the ACSP record, together with Evidence One approval and a `paymentsActive` flag that is true only when status is Eligible and the administrator has approved.
- Platform Administrator approval screen: show the two gates side by side (provider eligibility, Evidence One approval) and "Payments active" only when both are met. An ACSP whose payments are not active cannot be allocated paid cases and is not offered in referral matching (add this as a matching criterion, MATCH rule, source "Design, proposed"; the client has not decided it).
- Badge the step "Subject to payment provider confirmation" (the client wrote "subject to Stripe confirmation"). Reuse the `PendingDecision` pattern with a distinct label, because this is awaiting a provider, not the client.
- Seed: one Pending approval ACSP with status "More information needed", so the two gates can be shown. Existing Active ACSPs have payments active.
- Do not change the money rules: split payment, ACSP as merchant of record, payment authorised at instruct and taken on approval, 69 pounds plus VAT on referred and B2C cases only.

## 3. Document eligibility: wording fix and configurable lists (G2-07)

- Wording: Option 1 text says "any other document permitted under Option 1". "Group A" and "Group B" appear only in Option 2 screens, rules and notes. Search the UI, rules text, presenter notes and guided captions for any exception.
- Move the document lists into one data file, for example `src/data/documentRules.ts`, read by the evaluation in `src/lib/rules.ts` and by the individual document screens, so nothing is hard-coded in components. Three lists:
  - Option 1: biometric or machine readable passport, or Irish passport card; UK, Channel Islands, Isle of Man or EU photocard driving licence (full or provisional); identity card with biometric information from the EU, Norway, Iceland or Liechtenstein; UK biometric residence permit; UK biometric residence card; UK Frontier Worker permit; eVisa.
  - Option 2 Group A and Option 2 Group B, as listed in `Client_Amendments_2026-10-23.md`.
  - Each document has an id, label, option, chip expected (yes, no, sometimes) and an `expiryAllowanceMonths` field.
- Expired documents: H1 stays as decided (not accepted). The `expiryAllowanceMonths` values in the data are 0 and the setting that would allow expired documents is off. Show on the rules page and the decisions page: "Expired passports. Decided 19 October: not accepted. The client has asked the identity provider what it supports. Subject to provider confirmation." Do not choose for the client and do not enable any allowance.
- The lists are part of the rule set parameters: changed only by a Super Administrator in a draft version with a second approver, published with an effective date, audited, like any other rule change.
- Presenter note: the core identity branch (document validation, face match, liveness, chip where applicable) is separate from the optional address and PEP and sanctions checks, which each ACSP switches on or off. The client asked the provider for exactly this split on 23 October.

## 4. Option 2 through the identity provider (G2-14)

The client's current thinking: Option 2 is handled through the provider's own manual document review, if the provider confirms it can meet the Companies House requirements. The provider performs the supported document checks and returns its findings to Evidence One. The assigned ACSP completes any additional checks and keeps the final verification decision, as in Option 1.

- Everywhere Option 2 is described, replace "checked in person by a trained reviewer" with wording to this effect: "The certified identity provider's trained reviewers check your documents. [ACSP name] completes any further checks and makes the decision." Keep the Group A and Group B document guidance.
- Individual: the "I do not have a smartphone or tablet" link and the "Option 1 cannot support my document" route both create the Option 2 request. Badge it "Subject to provider confirmation".
- ACSP case review, for an Option 2 case: an "Identity provider findings" panel (simulated: documents checked, outcome of each supported check, anything the provider could not check) and an "Additional checks by you" checklist the ACSP ticks, with a reason field. Approve stays disabled until the checklist is complete and any Mandatory decision has a recorded reason. The report records that Option 2 was used and why.
- Rules: update the Option 2 rule text. Source "Design, proposed from the client's email of 23 October".
- Seed: one case whose Option 1 attempts failed (three attempts), moved to Option 2, with provider findings returned and the ACSP additional checks in progress. This is acceptance scenario 6 in section 6.
- Presenter note: raised with the provider by the client on 22 and 23 October, answer awaited as of 26 October.

## 5. Register correction with a fee (G2-10 and G2-13)

A new branch on a register difference. A flag is still a flag and nothing here is a Halt or a Block. This is not a fourth reviewer action. It is an outcome of the existing Mandatory decision on a register difference, called "Correction needed", and it creates a request to the client.

Flow:

1. The reviewer sees the register difference (name, date of birth, nationality or transliteration), with the existing prompt to report the discrepancy to Companies House. In the Mandatory decision they can record "No correction needed, I am satisfied" with a reason (existing behaviour) or "Correction needed".
2. "Correction needed" lets the ACSP raise a correction fee on top of the standard verification fee. Each ACSP sets its own correction fee; there is no platform-wide value. Fields: amount, short description of what will be corrected. The case moves to "Awaiting client approval of revised total".
3. The individual sees a request in the status tracker and the case messages: the original total, the correction add-on, the revised total, and the line "You are only charged when [ACSP name] approves your verification." They approve or decline the revised total. Approving authorises the card for the revised total (a second authorisation; nothing is taken). Declining returns the case to the reviewer, who can proceed without a correction, request information, or decline.
4. On approval of the revised total the case moves to "Awaiting register correction", expected 24 to 48 hours. The ACSP carries out the correction at Companies House outside the platform (Route B filing is the held option O2). The platform tracks it: a "Register corrected" tick with the date. Approve is disabled until it is ticked. Design interpretation, confirm with the client.
5. The ACSP returns and presses Approve, with step-up. The payment is taken for the total: the ACSP's verification fee plus the correction add-on go to the ACSP, and the 69 pounds plus VAT platform fee is deducted once, on referred and B2C cases only, not per correction. Own-client cases carry no 69 pounds. The client invoice in the ACSP's name itemises the verification fee and the correction add-on. Everything is audited.
6. The ACSP then makes the verification statement through the existing Route A submission handoff. The client receives the personal code by email from Companies House as usual, and the next day the existing prompt asks them to confirm it arrived.
7. Decline, or an ACSP lapse, at any point releases both authorisations: "Nothing was taken".

Details:

- Referral Partner status mapping: awaiting client approval is "Further information required", awaiting register correction is "In progress". No new status. The Partner sees status only and the check result for the register comparison as "flagged". Never the fee detail, never documents.
- The correction add-on is part of the ACSP Professional Fee, shown as its own line. It is not a fifth fee type.
- When a Referral Partner paid with an Agent Payment Code, show the correction add-on as paid by the client, with a "Pending your decision" badge: who pays the add-on in that case has not been decided.
- Rules: add rules for the correction branch (REG series), for the revised total authorisation and for payment taken on Approve, outcomes as above, source "Design, proposed from the client's email of 23 October". Parameters: `correction_turnaround_hours_min` 24 and `correction_turnaround_hours_max` 48.
- Seed: Corrigan Marine Services Ltd (existing register difference) shows this branch in progress. Seed a second case already past step 5 (approved, payment taken, invoice itemised) so the invoice and statement show a correction line.
- Billing: the monthly statement reconciles the add-on case by case. The client invoice shows the add-on.
- The existing `Correction.tsx` (post-submission correction using ACSP04) is unchanged. Which form "ACSP04" means is still open (P5).

## 6. Gate 2 acceptance scenarios (presenter-only page and guided track)

The client wants Gate 2 acceptance to be a working end-to-end workflow. Add a presenter-only page "Gate 2 acceptance scenarios" in the presenter menu next to "Decisions and open points", and a guided demo track "Gate 2 acceptance walkthrough" (keep the Guided demo launcher in the header on every screen and on the landing page, labelled with its step count; add the new track to it).

Data in `src/data/acceptanceScenarios.ts`. For each of the eight scenarios: number, title, persona, the screens to open (deep links), what is simulated, what depends on the provider. The scenarios:

1. Register two independent ACSPs and approve their accounts through the administrator portal. Use the onboarding flow twice (seed two applications so it is quick) and the administrator approval with the two payment gates from section 2.
2. Assign separate clients and verification cases to each ACSP. Show allocation in the administrator view and each ACSP's own queue.
3. Complete the provider verification journey: document validation, facial recognition and liveness (with the chip step where it applies, and the desktop to phone hand-off).
4. The reviewer journey: approve, request further information and decline, each behind step-up. Show the rejection message exactly as in CLAUDE.md.
5. Record separation: ACSP A cannot access, view or modify ACSP B's records. The existing "This case is held by [other ACSP]" screen in `CaseReview.tsx` stays. Make it complete: opening another ACSP's case by link shows no case data, no names and no documents, offers no action, and writes an "Access refused" event to the requesting ACSP's own audit chain (reference only, no personal data). Check that the same holds for the submission workspace, the messages, the record and the export routes, and that no store action accepts a case id belonging to another ACSP (guard the actions, not just the screens).
6. A failed verification and the Option 2 fallback (the seed case from section 4), badged "Subject to provider confirmation".
7. Generate and export the verification audit trail. The ACSP's own hash-chained audit trail can be exported behind step-up from the verification record; confirm this exists and includes event type, actor, timestamp and short hashes, and no document content, no codes and no personal data beyond what the audit already holds. Add it if missing.
8. Companies House submission handoff and recording of the confirmation (existing Route A workspace, interstitial, return and verification reference). Includes the next-day "has the code arrived" confirmation.

The page also says, in one sentence: "These scenarios form part of the formal Gate 2 acceptance testing." Mark each scenario "Shown in this demo", "Simulated" or "Depends on provider confirmation".

## 7. Copy, decisions page, presenter notes

- Decisions and open points page. Decided: add "G2-12 and G2-18 messaging carries no codes (23 Oct)". Changed after being decided: P4 as in section 1. Still open, each "Pending your decision" or "Subject to provider confirmation": G2-02 payment connection (subject to the payment provider's confirmation); G2-14 Option 2 through the identity provider (provider to confirm); G2-08 and G2-09 expired and non-biometric passports, manual review, optional address checks, PEP pricing (provider to confirm; H1 stays as decided meanwhile); correction fee flow design (who carries out the correction and by which route, who pays the add-on under an Agent Payment Code, Partner status mapping, second authorisation, one 69 pound fee per case); whether code-like text should block the message; whether an ACSP without active payments is excluded from allocation. Keep the existing open points from CLAUDE.md.
- Presenter notes (not on client-facing screens): the Stripe answers of 23 October (direct charges with an application fee, subscriptions through billing on the Evidence One account) as a plain description, with the provider kept generic on screen.
- Marketing copy stays in `src/data/copy.ts`. Footer and legal pages unchanged: Evidence One Limited, company number 17509214, registered office 1 Giltspur Street, London EC1A 9DD, info@evidenceone.co.uk, no ICO number, "Gates 2 to 5 agreement for signature by Friday 30 October 2026".
- Update the guided demo captions for: no code sharing and the warning; Connect payments; the provider-based Option 2; the register correction branch; the acceptance walkthrough. Remove any caption about code messages.

## 8. Seed and reset

Seed per `CLAUDE.md`, with these changes: no code message; an ordinary message exchange instead; one Pending approval ACSP with payments "More information needed"; one Option 2 case via the provider; Corrigan Marine Services Ltd in the correction branch plus one approved case with an itemised correction line; the two seed applications for acceptance scenario 1. "Reset demo" restores everything.

## 9. Before you finish

Walk the whole story once as each persona (Referral Partner, ACSP, Individual, B2C client, Platform Administrator, Super Administrator), at desktop width and at phone width, and check:

- No code message anywhere: no composer option, no card, no "Show code", no 30 day deletion, no fast-forward, no code audit events. The warning shows in both composers and a code-like message is not sent. The next-day prompt never asks for the code. No form field asks for a code anywhere.
- Payment connection has no bank field, no real brand, shows the two gates, and payments are active only when both are met. Money rules unchanged.
- "Group A" and "Group B" appear only with Option 2. Option 1 says "any other document permitted under Option 1". The document lists come from data and expired allowances are off.
- Option 2 shows the provider route with its badge, the findings panel and the ACSP checklist, and the ACSP keeps the decision.
- The correction branch: fee raised, client approves the revised total, awaiting register correction, Approve disabled until ticked, payment taken once on Approve, one 69 pound fee on referred and B2C cases only, itemised invoice, release on decline or lapse, Partner sees status and check result only.
- The acceptance page and track cover all eight scenarios. ACSP A cannot read or change ACSP B's data by screen, by link or by store action, and the refusal is audited.
- The provider is never named, no Evidence One app wording, no em-dashes, no emojis, no version numbers in the UI, no 14, 15 or 16 October dates.
- `npm run build` passes with zero TypeScript errors.

Then commit in small commits, push only when I say, and give me a short list of what changed, anything you could not do, and anything in `CLAUDE.md` that turned out to conflict with the existing code.
