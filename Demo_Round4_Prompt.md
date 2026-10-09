Read `CLAUDE.md` in full before doing anything. It was rewritten on 9 October 2026 and replaces the previous version. Its hard rules apply to everything below: synthetic data only, no Evidence One app, the named ACSP is the service provider and Evidence One the technology provider, the platform never verifies, AI is advisory only, no GOV.UK lookalikes, no One Login credentials, the identity provider is never named, WCAG 2.2 AA, UK English, no em-dashes, no emojis, no version numbers in UI copy.

This is round 4. Round 3 (`Demo_Round3_Prompt.md`) built the 6 October restructure. This round aligns the demo with the client's answers of 7 October and her amendments of 9 October, ahead of the call at 15:00 on Friday 9 October 2026, when she will look at the demo again. Where Round 3 and this round differ, this round wins. Work through the sections in order, in small commits, and keep `npm run build` passing with zero TypeScript errors before every push. Sections 1 to 5 are the priority for the call; do 6 to 8 after them.

## 0. Survey first

Before changing anything, read `src/types/domain.ts`, `src/store/*`, `src/data/*` (especially `rules.ts`, `billing.ts`, seed ACSPs and cases), `src/lib/rules.ts`, `src/App.tsx`, and every feature folder under `src/features/`. List every place that:

- halts Route A on a name, date of birth, nationality or transliteration difference;
- shows a chip scan, a "check your passport chip" handoff, a QR code or an NFC scene, or mentions `passport_chip_reading`;
- asks for supporting evidence for anything other than an expired document or a name change, or uses a three-month window;
- uses SMS for step-up;
- applies the £69 to every case, lets "Admin" set fees, or shows the Referral Partner a document or an evidence grant;
- uses Referral Partner statuses other than Invited, In progress, Further information required, Completed, Declined;
- uses the old ACSP statuses, shows a lapsed ACSP's case list to a Referral Partner, or lists the languages Ukrainian or Turkish;
- shows a decision on Escalate.

Fix all of them through the sections below. Do not leave any behind.

## 1. Browser route, no chip reading (G2-08, IDVT-01, H1)

- Remove the optional "Check your passport chip with the identity provider" handoff and the `passport_chip_reading` setting added in round 3. Passports, BRPs and EU identity cards go through the browser route like any other document, on desktop and mobile.
- Identity step on desktop: "Upload your document" from the computer, or "Continue on your phone" by QR code or text link, which captures the document in the phone's browser and returns to the same case (never described as an app or as chip reading). On mobile: direct camera capture.
- Liveness on desktop: "Continue on your phone" is preferred, and "Use this computer's camera" is offered as a supported choice for people without a smartphone, with a calm line such as "A phone camera usually gives a clearer result." Both are labelled "Certified identity provider".
- Rules page: replace the chip setting with the decision setting `chip_not_read_fallback`, default "Accept a passing web-route result while the Companies House answer is awaited", alternative "Request another Option 1 document, then Option 2", badge "Pending your decision". IDVT-01 now reads: "Document has a chip and the chip is not read on the case. Outcome set by chip_not_read_fallback." Companies House has not yet answered her question whether Option 1 requires the chip to be read; say so in the setting's help text.
- DOC-EXP-01: an expired passport is asked for another document until Companies House replies. Show "Pending your decision" (H1). Where an expired document triggers ADDL-01, it is a Request, never a Halt.
- Case review: no chip result row. Add a quiet line "Chip not read by Evidence One. Browser route result accepted under the current setting." on passport cases.
- eVisa holders: passport plus any one document from Group B, until the provider confirms an eVisa check in the browser.

## 2. Register differences are flagged, never halted (G2-10)

- Name, date of birth, nationality and transliteration differences between the person's details and the register no longer halt Route A. They raise a Flag and a Mandatory decision for the ACSP reviewer, with a prompt "Report this difference to Companies House" that logs the prompt and the reviewer's choice on the case (no filing through an API).
- Corrigan Marine Services Ltd: the difference now shows as a flagged case in review, not a halted one. The Route B register correction task still exists for genuine register corrections.
- Seed at least one case with a name difference, one with a transliteration difference and one with a nationality difference, all proceeding to review.

## 3. Proof of address, supporting evidence, case messages (M1, G2-18, G2-12, M7)

- `supporting_evidence_months` = 6. After the identity checks every individual is asked for one proof of current address dated within six months (ADDL-02), including people whose licence, identity card or BRP shows an address. Badge "Pending your decision" on the exact wording (P3).
- Other supporting evidence only on ADDL-01 (expired document) and ADDL-03 (former name or name change), each worded "We need one supporting document" and each a Request. Remove the "does not confirm 12-month address history" trigger everywhere, including the AI observations and the supporting-document helper.
- Optional bank statement redaction (option O3): on a bank statement upload, show an "Option" badge and a preview where transaction amounts and payees are masked and issue date, name, address and transaction dates stay visible. "AI observation. Advisory only. You confirm the redaction." The individual confirms; only the redacted copy appears to the reviewer.
- Case messages: a message thread in every case between the ACSP reviewer and the individual (individual journey and ACSP case review), email notification shown as a sent-notification row, every message in the audit trail. A warning appears if someone types what looks like a personal code or authentication code: "Please do not share codes here. Companies House sends the personal code directly to the person." The text is not kept. Referral Partners never see messages. Seed one case with a short exchange.
- After submission and Companies House confirmation, the individual sees "Please confirm that the code has arrived from Companies House" the day after confirmation (M7, Pending your decision) with Yes and Not yet. Never collect the code itself.
- Individual status tracker for an already-verified person (REG-04): the person who sent the invite is told before payment, and the individual may continue or stop.

## 4. Money, roles and sign-in (H2, H3, 7 October answers)

- £69 plus VAT applies only to referred cases (via a Referral Partner or B2C). It is deducted automatically from each payment for every ACSP. Evidence One platform-fee invoices document the deduction. An ACSP's own client shows no platform fee and "Included in your subscription". Add a case source (`referred`, `b2c`, `own_client`) to the case type and drive the fee from it; seed one of each.
- Subscription: a monthly fee alone, or a monthly fee with a number of cases included, both "Price not set" and "Terms to be set by the client by 4 January 2027". Payment provider fees are shown on the ACSP's monthly statement.
- Roles: replace "Admin" with **Platform Administrator** (approves ACSPs and Referral Partners, manages allocation and monitoring, reads platform events in the audit trail, no access to evidence) and **Super Administrator** (sets the platform fee and subscription plans, switches referral commissions on, publishes rule sets and disclosure text, each with a visible second-approver step). Remove "Admin (second approver)" as a separate persona; the second approver is another Super Administrator, shown in the flow. The Fees and plans page, the commissions switch and rule publication are not available to the Platform Administrator, who sees "Super Administrator only, with a second approver".
- Step-up: passkey or authenticator code only. Remove SMS from every step-up screen. SMS stays for individuals' one-time codes and mobile number confirmation. Badge "Pending your decision" (H2) on the step-up settings.
- Mobile numbers are asked for in ACSP and Referral Partner onboarding (contact people and users), confirmed by one-time code.
- Idle timeouts 15 minutes (professionals) and 30 minutes (individuals): show a short "You will be signed out in 1 minute" notice component, wired to the guided demo only.

## 5. Referral Partner view, B2C suggestion, ACSP lapse and monitoring

- Referral Partner statuses: Invited, In progress, Further information required, Completed, **Declined**. Each case also shows check results (identity document, liveness and face match, register comparison) as passed, flagged or not passed. Remove every document view, evidence grant and grant permission. Partners outside the UK see status only (add the Dubai partner as the example, "Pending your decision", P11).
- B2C: after personal information show "Suggested ACSPs", a ranked list from the structured onboarding criteria, each with its own fee, turnaround and why it matches (price, languages, countries, capacity). The client may ask for "Show me a different ACSP" once, before instructing; the second request is not offered. An administrator confirms the allocation at launch; show that step in the Platform Administrator view. Label the ranking "Ranked by clear criteria. Not AI."
- ACSP statuses everywhere: Pending approval, Active, Not yet listed, Suspended, Ceased, Withdrawn. Update the seed, the monitoring page, the matching rules and the types.
- Monitoring page: add "Check both published Companies House lists" as a fortnightly check where an administrator confirms every name match, and "Yearly list upload": the Platform Administrator uploads a synthetic Companies House ACSP list (CSV) and the platform cross-checks every name against the platform register and lists the ACSPs not found, each confirmed by an administrator. An ACSP not found is "Not yet listed" with "Time to register: to be set" and "Pending your decision" (M4, including whether the yearly upload replaces or sits beside the fortnightly check). Not-yet-listed ACSPs can still become Active when the listing arrives; they do not stay blocked.
- ACSP lapse: new cases pause; the lapsed ACSP's open cases are offered to another ACSP with the individual's agreement (show the individual's agree or decline step); the Platform Administrator and the ACSP see the list of cases it verified (ACSP-12). The Referral Partner dashboard shows no such list, with a "Pending your decision" note in the guided demo that the client may want partners to see their own affected clients (M3). Individuals are contacted only on the client's instruction: show a disabled "Contact individuals" button with that explanation.
- Review timeline: wherever the review window appears, acceptance closes Thursday 15 October 2026 and signature is Friday 16 October (M2, to confirm).

## 6. Languages

- The language switch lists English plus **Russian, Arabic, Spanish, French, Italian, Chinese (Simplified)**, available on every individual-facing screen at any time. Remove Ukrainian and Turkish. Arabic is right to left (set `dir="rtl"` on the individual journey container and mirror the layout). Strings in `src/data/i18n/`, with "AI translation. Advisory only. The English text is the version of record." and "Show English". Legal text (declarations, consent) stays in English with the translation beneath. "Translation reviewer: to be named" appears on the language notice in the guided demo (P9).

## 7. Rules, Admin and retention updates

- `src/data/rules.ts`: update ADDL-01 to ADDL-03 as in section 3 (remove the address history trigger, ADDL-02 becomes every individual), IDVT-01 and DOC-EXP-01 as in section 1, IDVT-07 attempts three, REG-10 to REG-17 now Flag or Mandatory decision per G2-10, ACSP-10 to ACSP-13 and the status set per section 5, AML-01 "where screening is switched on for the ACSP", SUB-04 with no personal code field, and a rule for case messages (code warning). Parameters: `supporting_evidence_months` 6, `idvt_attempts` 3, reminders 2, 5, 10 days, `abandon_after_days` 30, `invite_valid_days` 14, `escalate_enabled` Off, `pep_screening` per ACSP (default shown "Pending your decision", P6), `referral_commissions` Off. Source code "C, 7 October" or "C, 9 October" where the client determined it, "Design, proposed" where she has not.
- Rules page: decision settings with "Pending your decision" badges for `chip_not_read_fallback`, DOC-EXP-01 handling, step-up channels, personal code prompt timing, ACSP register period, yearly upload versus fortnightly check, and PEP screening default.
- Platform storage (call agenda item 4): add an Admin **Storage and retention** page that shows what is kept and where (evidence store, application database, invoices and statements, audit anchors; all in the client's own Google Cloud account in London with customer-managed keys), seven years from decision, and an estimate panel (about 10 MB per case; 100, 1,000 and 10,000 cases a month, with yearly additions, held at seven years and the indicative monthly cost) marked "Indicative, to be confirmed". Add decision cards, each with "Pending your decision": archive evidence after 12 months; keep full liveness media or stills plus the provider result; upload limit (10 MB a file, five files per request); ACSP keeps its own retention (export then remove from the platform); storage included in subscriptions or capped. Seed numbers only, never real data.
- Open points panel in the guided demo (a single page "Points for the call") listing P1 to P11, H1, H2, M2, M3, M4, M7 and the provider decision, each with a one-line summary and "Pending your decision". Presenter-only.

## 8. Guided demo and seed

- Update the guided demo captions for: browser route without chip reading on desktop and mobile; flagged differences; proof of address; case messages; referred versus own-client fees; suggested ACSPs; Referral Partner status and check results; ACSP lapse and yearly list upload; storage page; six languages.
- Seed data per CLAUDE.md, with cases covering: referred, B2C and own client; name, transliteration and nationality differences; expired document; name change; a message exchange; a lapsed ACSP with its verified-cases list; a Not yet listed ACSP; the Dubai partner with status only. "Reset demo" restores everything.

## 9. Before you finish

Walk the whole story once as each persona (Referral Partner, ACSP, Individual, B2C client, Platform Administrator, Super Administrator), at desktop width and at phone width, and check:

- No chip scan, chip handoff or NFC scene anywhere; no app wording; the provider is never named.
- No Route A halt on a name, date of birth, nationality or transliteration difference; a prompt to report the discrepancy appears.
- Proof of address within six months for every individual; other supporting evidence only on an expired document or a name change; each is a Request.
- £69 only on referred and B2C cases, deducted automatically; own clients on subscription; "Price not set".
- Only the Super Administrator reaches fees, plans, commissions and rule publication, with a second approver. No SMS on any step-up screen.
- Referral Partners see status and check results only, including Declined; never documents, evidence grants or messages.
- ACSP statuses match the new set everywhere; the lapsed ACSP's case list is visible to the Platform Administrator and the ACSP only.
- Languages are Russian, Arabic, Spanish, French, Italian and Chinese; Arabic is right to left.
- No screen shows or asks for a personal code, a company authentication code or One Login details.
- No em-dashes, no emojis, no version numbers in the UI.
- `npm run build` passes with zero TypeScript errors.

Then push, and give me a short list of what changed, anything you could not do, and anything in CLAUDE.md that turned out to conflict with the existing code.
