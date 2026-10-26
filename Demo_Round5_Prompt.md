Read `CLAUDE.md` in full before doing anything. It was rewritten on 23 October 2026 and replaces the previous version. Start with its section "What changed since 9 October", because several rules reverse what Round 4 built. Its hard rules apply to everything below: synthetic data only, no Evidence One app, the named ACSP is the service provider and Evidence One the technology provider, the platform never verifies, AI is advisory only, no GOV.UK lookalikes, no One Login credentials, the identity provider is never named, WCAG 2.2 AA, UK English, no em-dashes, no emojis, no version numbers in UI copy.

This is round 5. Round 4 (`Demo_Round4_Prompt.md`) aligned the demo with the client's answers of 7 and 9 October. This round applies her answers of 15, 19, 20 and 22 October, her choice of TrustID, and TrustID's written answers of 23 October. Where Round 4 and this round differ, this round wins. The client will review the demo over the weekend of 24 and 25 October, so sections 1 to 5 are the priority for today; do 6 to 8 after them. Work in small commits and keep `npm run build` passing with zero TypeScript errors before every push.

## 0. Survey first

Before changing anything, read `src/types/domain.ts`, `src/store/*`, `src/data/*` (especially `rules.ts`, `billing.ts`, seed ACSPs, cases and plans), `src/lib/rules.ts`, `src/App.tsx` and every feature folder under `src/features/`. List every place that:

- mentions `chip_not_read_fallback`, "Accept a passing web-route result", "Use this computer's camera", "Chip not read by Evidence One", a webcam-only liveness route, or the rule that an eVisa holder provides a passport plus a Group B document;
- takes payment before the identity checks, or issues an invoice before approval;
- warns about, blocks or discards a code typed into a case message, or has a "Pending your decision" badge on the personal code prompt timing;
- shows "Price not set", "Terms to be set by the client by 4 January 2027", or any subscription without the three packages;
- offers "Let Evidence One match an ACSP" to a Referral Partner, or has no Bulk / Bespoke Request;
- hides a lapsed ACSP's affected clients from the Referral Partner, shows "Time to register: to be set", or says the yearly upload may replace the two-weekly check;
- shows a "Pending your decision" badge for H1, H2, M3, M4, M7, P2, P3, P6, P7, P8, P9, P10 or P11;
- says biometric deletion within 30 days, mentions the 15 or 16 October dates, or shows a "Points for the call" page;
- makes Route B, language help or bank statement redaction look like part of the first release.

Fix all of them through the sections below. Do not leave any behind.

## 1. Identity provider journey: chip read as the provider's step, desktop hands off to the phone

The provider is decided (TrustID) but is never named. Everything on screen says "certified identity provider".

- Remove the `chip_not_read_fallback` decision setting, "Use this computer's camera" and every webcam-only path. Remove the "Chip not read by Evidence One. Browser route result accepted under the current setting." line.
- **Biometric passport:** inside the same provider journey, after the document capture, add the step "Read your passport chip with the identity provider's chip reader": a QR code and "or send me a link", a line saying the provider's chip reader runs on the person's phone and is not an Evidence One app, and a simulated return to the same case with the chip result recorded. **Non-biometric passport:** no chip step. **Any other Group A document the provider can read** (UK photocard driving licence, EU identity card, BRP): same journey, no chip step unless the document has a chip.
- **Desktop:** the identity step shows a QR code and "or send me a link"; the person finishes on their phone or tablet; the desktop screen then shows the result ("We have your result, continue"). Simulate the return. **Mobile:** direct capture. Add a calm line explaining why a phone is needed ("A phone camera gives a clearer result").
- **No smartphone or tablet:** a link "I do not have a smartphone or tablet" leads to a request to the ACSP for a trained human check (Option 2), with a "Pending your decision" badge (client has not answered; presenter note: raised by Halil on 23 October).
- **Chip not read:** let the person continue, record "No chip read" on the case, and give the reviewer a Flag and a Mandatory decision "Chip not read. Record why you are satisfied". IDVT-01 is rewritten to match; the source code is "Design, proposed from the client's determination of 13 October" and the setting text says Companies House does not mandate chip reading and the ACSP decides.
- **Case review:** a "Security features validated" panel on every case showing document authenticity and security features, chip (read, not read, or not applicable), liveness, face match, register comparison, and where the ACSP switched them on, PEP and sanctions and the electronic address check. This is the per-case evidence the client was promised on 13 October.
- **Expired passports (H1):** not accepted. The person is asked for another document, as a Request, never a Halt. Remove the "Pending your decision" badge from DOC-EXP-01.
- **eVisa:** an accepted Option 1 document on the same route. Add a presenter note that the provider checks eVisas directly with the Home Office. Remove the passport-plus-Group-B rule.
- Presenter notes (not on the client-facing screens): returning to our page after the check and where the chip step sits are still to be confirmed with the provider, so the simulated return is a placeholder.

## 2. Payment after approval (P10)

- In the individual journey, move the payment step to the instruct step: "You are paying [ACSP name]. Evidence One collects this payment on [ACSP name]'s behalf as its agent. Your card is authorised now and you are only charged when [ACSP name] approves your verification." Show "Authorised, not yet taken" in the status tracker and the case.
- On approve in the ACSP case review (after step-up), take the payment, deduct the £69 plus VAT on referred and B2C cases, issue the client invoice in the ACSP's name, and record all of it in the audit trail. On decline, request information that leads to a lapse, or an ACSP lapse, release the authorisation and show "Nothing was taken". Agent Payment Code payments follow the same sequence ("Paid by [Partner] on your behalf, taken on approval").
- Update the invoice timestamps, the monthly statement, the billing seed and the guided demo captions to match. Invoices exist only for approved cases.
- Add a **Complaints and refunds** page for the Platform Administrator (a short list of seeded complaints, refund action with a reason, audited). Add a "Pending your decision" note: what happens to the £69 on a refunded case.

## 3. Codes in case messages (P4) and the next-day prompt (M7)

- Replace the old "do not share codes here" warning. In the message composer add a "Send a Companies House code to [ACSP]" option for the individual. It sends a hidden message only the allocated ACSP reviewer and the individual can open, with the line "Evidence One only carries this message to [ACSP]. It does not use the code." The ACSP reviewer sees a "Show code" action (with the view recorded in the audit trail, not the value) and a "Mark code received" button. When marked, show "This message will be deleted on [date, 30 days later]" and a simulated deletion in the demo (a "Fast-forward 30 days" action in the guided demo only) that replaces the text with "Deleted automatically".
- If ordinary message text looks like a code, show the gentle prompt in CLAUDE.md and do not block it.
- The audit trail records sent, received, viewed and deleted events with no value. Verification file export, Platform Administrator views, Referral Partner views and the Copilot never include code messages.
- The next-day prompt stays: "Please confirm that the code has arrived from Companies House", Yes and Not yet, never asking for the code. Remove its "Pending your decision" badge.
- Seed one case with a code message that has been received and is within its 30 days.

## 4. Subscription packages, storage, held options (15, 19, 20, 22 October)

- Add the three **provisional** packages from CLAUDE.md as plan settings in `src/data/billing.ts`: Easy £29 (5 cases, 2 GB), Pro £89 (25 cases, 10 GB), Scale £199 (60 cases, 25 GB), each with five files per request, 10 MB a file and £5 per additional case. Fields: monthly price, cases included, files per case, storage limit in GB, extra-case fee. Remove "Price not set" and the 4 January 2027 wording; label the packages "Provisional. The client confirms the final price and structure before go-live."
- **Referred cases sit outside the allowance.** Seed one ACSP on each package with own-client cases counted and referred cases shown separately ("Referred cases: covered by the £69, not counted"). Show a usage bar for cases and for storage against the limit. At the limit show "Upgrade your package or add storage". Show an extra-case line at £5 when an ACSP exceeds its allowance.
- ACSP **Billing > Plan** tab: current package, usage, extra cases, storage used, and the monthly subscription line on the statement. Super Administrator **Fees and plans** page: the £69 platform fee and the three packages as editable settings, each change creating a draft that needs a second Super Administrator to approve, audited. The Platform Administrator sees "Super Administrator only, with a second approver".
- **Route B is for subscription plans only (P2).** An ACSP without a subscription sees "Filings are available on subscription plans" in place of the Route B screens. Ongoing PEP and sanctions monitoring shows as a subscription-only setting, off, labelled "Later".
- **Held options:** add the `showHeldOptions` setting (default on) and the badge "Option. Available after go-live." on language help and the language switch (O1), the Route B filing screens including the Corrigan Marine WebFiling handoff (O2), and bank statement redaction (O3). Turning the setting off hides them. Add a toggle in the presenter menu.
- **Storage and retention page (Platform Administrator):** replace the decision cards with the decided rules from CLAUDE.md: seven years from decision; liveness media kept seven years; live storage with a paid subscription and archive storage without one; 10 MB a file and five files per request; ACSP export immediately after Approve or on request to an administrator, who releases the download and never opens the evidence; storage included in packages. Keep the indicative cost panel marked "Indicative, to be confirmed". Update the verification record screen: remove "biometric deletion within 30 days".
- ACSP **export release request:** an ACSP requests an export within seven years, the Platform Administrator approves and releases it (audited), the ACSP downloads behind step-up.

## 5. Referral Partner flow, Bulk / Bespoke Request, M3

- **Single referral:** client details, then 2 or 3 matched ACSPs each with fee and turnaround ("Ranked by clear criteria. Not AI."), the Partner selects one, chooses who pays, sends. Remove "Let Evidence One match an ACSP" for Partners. Keep it as simple as possible.
- **Bulk / Bespoke Request (O4, included):** a separate button on the Partner portfolio. A free-text request form, a message area between the Partner and the Platform Administrator, and in the Platform Administrator view a "Convert to linked cases" action that creates one Bulk Request with several individual verification cases and a placeholder row for additional Companies House services. Seed the example "I need 5 individual identity verifications, potentially with Companies House amendments, and I also need a corporate verification." Audited.
- **Linked cases panel (G2-19):** read-only structure on a case, showing the Bulk Request, its individual cases and a greyed-out corporate case labelled "Corporate verification is added later, when Companies House publishes the final requirements." Do not collect any corporate evidence.
- **M3:** when an ACSP lapses, the Referral Partner dashboard shows a notice listing only that Partner's own affected clients (name, status, which ACSP lapsed, the offer to move to another ACSP), never documents. Remove the "Pending your decision" note. Keep the disabled "Contact individuals" button with its explanation. The full ACSP-12 list stays with the Platform Administrator and the ACSP only.

## 6. ACSP settings and monitoring (M4, P6, P7, P8, P9, P11)

- ACSP onboarding and the ACSP profile: two per-ACSP switches, **PEP and sanctions screening** and **electronic address check (UK residents)**, no platform default, each ACSP chooses; ongoing monitoring is subscription-only and off. Remove the "Pending your decision" badge on PEP (P6), keep it only on the question whether a passing electronic address check removes the proof of address document.
- Monitoring page: "Not yet listed" shows "Time to register: 3 months" with a countdown; the yearly list upload sits beside the two-weekly check (say so on the page). Remove the M4 "Pending your decision" notes. Add a seeded Not yet listed ACSP.
- Remove "Pending your decision" from P7 (UK is fine), P8 (ranking), P9 (the client arranges language review; delete "Translation reviewer: to be named"), P11 (status only for partners outside the UK) and H2.

## 7. Rules, copy, footer, guided demo

- `src/data/rules.ts`: IDVT-01 (chip not read, Flag and Mandatory decision), DOC-EXP-01 (expired passport, Request another document), ADDL-02 (every individual, the exact P3 wording), a new case-message rule for code messages (hidden, 30-day deletion, never exported), SUB rules unchanged (no personal code field), ACSP-12 and the Referral Partner notice under M3, a rule for payment taken on approval, and a rule that Route B is for subscription plans only. Parameters: `supporting_evidence_months` 6, `idvt_attempts` 3, `code_message_retention_days` 30, `liveness_media_retention_years` 7, `max_file_mb` 10, `max_files_per_request` 5, `extra_case_fee_gbp` 5, `acsp_register_period_months` 3. Source codes "C, 19 October", "C, 20 October", "C, 22 October" or "C, 15 October" where the client decided, "Design, proposed" where she has not.
- Replace the "Points for the call" page with the presenter-only **Decisions and open points** page described in CLAUDE.md (Decided with dates, Still open with "Pending your decision").
- Footer and legal pages: Evidence One Limited, company number 17509214, registered office 1 Giltspur Street, London EC1A 9DD, info@evidenceone.co.uk. No ICO number. Replace any 14, 15 or 16 October date with "Gates 2 to 5 agreement for signature by Friday 30 October 2026".
- Marketing copy: move landing page slogans and marketing text into one data file and note in the presenter menu that the wording is a placeholder.
- **Guided demo:** keep the launcher in the header on every screen and as a prominent button on the landing page, labelled with the step count. The client could not find it on 9 October. Update the captions for: provider journey with the chip step and the phone hand-off; payment authorised then taken on approval; code messages; subscription packages and referred cases outside the allowance; Route B on subscription plans only; single referral and Bulk / Bespoke Request; Referral Partner notice of affected clients; storage page; held options.

## 8. Seed data and reset

Seed per CLAUDE.md, with cases covering: a biometric passport with the chip read; a biometric passport with the chip not read; a non-biometric passport; an expired passport asked for another document; an eVisa holder; a UK photocard driving licence; name, transliteration and nationality differences all flagged and proceeding; a name change; one referred, one B2C and one own-client case; a case with a message exchange and a code message; ACSPs on Easy, Pro and Scale; a lapsed ACSP with its verified-cases list; a Not yet listed ACSP; a Bulk Request converted into linked cases; complaints and a refund for the Platform Administrator. "Reset demo" restores everything, including plans, usage and requests.

## 9. Before you finish

Walk the whole story once as each persona (Referral Partner, ACSP, Individual, B2C client, Platform Administrator, Super Administrator), at desktop width and at phone width, and check:

- No provider name or brand anywhere; no Evidence One app wording; the chip step is described only as the identity provider's chip reader.
- Desktop identity step hands off to the phone; no webcam-only route; the no-smartphone link leads to the Option 2 request with its badge.
- Payment is authorised at instruct and taken only on approval; nothing is taken on a decline or lapse; invoices exist only for approved cases.
- £69 only on referred and B2C cases, deducted when the payment is taken; own clients on Easy, Pro or Scale; referred cases outside the allowance; packages labelled Provisional.
- Code messages are hidden from Referral Partners, the Platform Administrator, exports and the Copilot, auto-delete 30 days after "Code received", and never appear as a value in the audit trail. No form field asks for a code anywhere else.
- Route B, language help and bank statement redaction carry the "Option. Available after go-live." badge, and `showHeldOptions` off hides them cleanly.
- Single referral shows 2 or 3 matched ACSPs; the Bulk / Bespoke Request converts into linked cases; the corporate case is greyed out.
- The Referral Partner sees only its own clients affected by a lapsed ACSP; the full verified-cases list is for the Platform Administrator and the ACSP only.
- Only the Super Administrator reaches fees, packages, commissions and rule publication, with a second approver. No SMS on any step-up screen.
- No leftover "Pending your decision" on H1, H2, M3, M4, M7, P2, P3, P6 to P11; the open badges remain only on the points listed in CLAUDE.md.
- No em-dashes, no emojis, no version numbers in the UI, no 14, 15 or 16 October dates.
- `npm run build` passes with zero TypeScript errors.

Then push, and give me a short list of what changed, anything you could not do, and anything in CLAUDE.md that turned out to conflict with the existing code.
