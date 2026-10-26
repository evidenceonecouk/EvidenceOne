# Client amendments of 23 October 2026 (Gate 2 criteria)

Prepared 26 October 2026 for Celik Yuce, Labters Ltd. Internal working note, not for the client.

## Sources read

- Anastasiia, "Re: Evidence One: revised documents with your answers", Fri 23 Oct 2026, 18:18. This is the main amendments email. Sent after the Round 5 prompt (23 Oct, 17:29) was written, so Round 5 does not reflect it.
- Anastasiia, same thread, 23 Oct 17:38: two Stripe questions (the 69 pound split, how subscriptions are paid). Answered by Halil at 18:06 (Stripe Connect direct charges with an application fee; subscriptions through Stripe Billing on the Evidence One account). No demo change needed, but see "Payment onboarding" below.
- Anastasiia to TrustID, 23 Oct 15:05 (Labters copied): asks for a core identity branch without optional checks, lists the Option 1 and Option 2 document lists, and asks about expired and non-biometric passports and about pricing of the optional checks.
- TrustID answers of 23 Oct 16:30, already in CLAUDE.md (QR hand-off to a phone, chip reader hosted in the EU, retention 7 to 31 days, eVisa checked with the Home Office).
- Anastasiia, 26 Oct 10:17: she has emailed TrustID twice with no reply and needs a corrected contract before signing. Not a demo item.
- Halil to Anastasiia, 23 Oct 19:14: the demo update was complete but was held back to be reviewed again from scratch once her latest changes are incorporated. So the client has not yet seen the Round 5 demo.

State of the demo repository on 26 October: the last commit is 9 October ("Header Fix"). All Round 5 work is uncommitted in the working tree (114 changed paths, including new files such as `src/data/packages.ts`, `src/data/bulkRequests.ts`, `src/features/bulk/`, `src/components/app/CodeMessageCard.tsx`). Commit Round 5 before starting Round 6.

## The amendments

| Ref | Criterion | What she asked | Status | Effect on the demo |
|---|---|---|---|---|
| A1 | G2-02 ACSP onboarding | Stripe Connect built into ACSP registration: ACSP clicks Connect payments, the payment provider collects business, representative and payout details, confirms eligibility, and Evidence One activates payments only when the provider's requirements and our own ACSP approval are both met. Evidence One must never collect or store the ACSP's bank credentials. "Subject to Stripe confirmation." | Apply, marked subject to provider confirmation | Replace the simple "Connect a payout account" button in `JoinAcsp.tsx` with a Connect payments step and a two-gate activation. Payment provider stays generic in the UI. |
| A2 | G2-07 document eligibility | "Group A" is an Option 2 classification, not Option 1. Replace "any other Group A document" with "any other document permitted under Option 1". Eligibility rules must stay configurable so Companies House changes need no redevelopment. | Apply | Wording fix in CLAUDE.md and Round 5. The built UI only uses Group A for Option 2, which is correct. Move the document lists into a data file driven by settings. |
| A3 | G2-14 Option 2 fallback | Option 2 handled through TrustID, provided TrustID confirms its manual document review can meet the Companies House requirements. TrustID does the supported document checks and returns findings to Evidence One. The assigned ACSP completes any additional checks and keeps the final decision, as in Option 1. Questions already raised with TrustID. | Pending provider confirmation | Reword the Option 2 screens, add a findings panel and an ACSP additional checks list, badge it "Subject to provider confirmation". |
| A4 | G2-12 and G2-18 codes | Messaging is for verification-related communication only. It must not carry Companies House personal codes, company authentication codes, passwords or other credentials. A clear warning is shown. Evidence One does not request, collect or intentionally store codes. Companies House sends the personal code to the individual. If an ACSP needs a code for a later filing, the ACSP and client arrange transmission themselves. Evidence One may record that the individual confirmed receipt, without asking for the code. No dedicated code-sharing feature in Gate 2. Secure credential sharing can come later if ACSPs show a genuine commercial need. Reconcile G2-12 with G2-18. | Apply. This reverses P4 (decided 19 and 20 October) | Remove the code message type, the Show code and Mark code received actions, the 30 day deletion and the Fast-forward action. Restore the warning. Keep the next-day "has the code arrived" prompt. |
| A5 | G2-10 and G2-13 register discrepancies and corrections | Where the ACSP decides a discrepancy needs a correction, the ACSP can raise a fee on top of the standard verification. When the client approves the revised total, the ACSP carries out the correction (24 to 48 hours) and the case stays pending. Once the register is corrected the ACSP returns and clicks Approve, and payment is taken through Stripe (standard 69 pounds plus VAT, and the verification plus add-ons to the ACSP). Then the ACSP notifies Companies House with the verification statement, the client receives the code by email, and the next day confirms to Evidence One that it arrived. | Apply, with design interpretations listed below | New correction branch on a register difference. Corrigan Marine Services Ltd is the seeded case. |
| A6 | G2-08 and G2-09 TrustID integration and optional checks | Wait for TrustID's answers on expired and non-biometric passports, manual document verification, optional address checks, PEP and sanctions screening and pricing before finalising these elements. | Hold | Keep the decided behaviour, add a presenter note, mark the affected settings "Subject to provider confirmation". Do not change them yet. |
| A7 | Gate 2 final demonstration and acceptance testing | Acceptance should be a working end-to-end verification workflow, not isolated features. Eight scenarios listed in the next section. They are to form part of the formal acceptance testing. | Apply | New presenter-only page and a guided demo track for the eight scenarios. A draft wording change for the acceptance criteria is in `Gate2_Acceptance_Amendments_Draft.md`. |
| A8 | Principle | Deliver a complete, functional, testable core verification process and avoid complexity or duplicating what TrustID already provides. | Guidance | Keep the core identity branch separate from optional checks (already per-ACSP switches). No extra identity features beyond the provider journey. |

## The eight Gate 2 acceptance scenarios (her wording, condensed)

1. Register two independent ACSPs and approve them through the administrator portal.
2. Assign separate clients and verification cases to each ACSP.
3. Complete the provider verification journey: document validation, facial recognition and liveness.
4. Reviewer journey: approval, request for further information and rejection, with the required authentication controls.
5. Neither ACSP can access, view or modify the other ACSP's records.
6. A failed verification and the applicable Option 2 fallback, subject to the provider's confirmed capabilities.
7. Generate and export the verification audit trail.
8. Companies House submission handoff and recording of the confirmation.

## Conflicts with CLAUDE.md of 23 October and with the Round 5 build

| # | Conflict | Proposed handling |
|---|---|---|
| C1 | P4 (codes passed through case messages, deleted 30 days after the ACSP has them) was decided on 19 and 20 October, and she approved the 30 days on 20 October. Her 23 October email removes it from Gate 2. Round 5 section 3 built it across about 17 files (see the list in Round 6, section 1). | Latest instruction wins. Remove the feature, restore the warning, record P4 on the Decisions page as "reversed by the client on 23 October". Do not argue. |
| C2 | The 9 October rule said the warning text "is not kept". Her new wording says Evidence One does not "intentionally store" codes. | Restore the 9 October behaviour (warn, message not saved until edited). Design interpretation, confirm wording with the client. |
| C3 | H1 (expired passports not accepted, decided 19 October) against her own 23 October email to TrustID, which lists passports up to 6 months expired and BRPs up to 18 months expired as Option 1 documents, and asks TrustID whether eligible expired passports are supported. Her Gate 2 email also lists expired passports as awaiting TrustID. | Keep H1 as decided. Make the expiry allowance a setting that defaults to none, badged "Subject to provider confirmation". Do not choose for her. Raise it in the email questions below. |
| C4 | "Register differences are flagged, never halted" against "the case stays pending until the register is corrected". | A flag stays a flag. The pending state is started by the reviewer choosing "Correction needed" on the Mandatory decision. It is not a Halt or a Block and it is not a fourth reviewer action: it creates a client request for the revised total. |
| C5 | CLAUDE.md says Option 2 is "a request to the ACSP for a trained human check". A3 routes it through the provider. | Show the provider route with the badge "Subject to provider confirmation". Keep the Group A and Group B document guidance. |
| C6 | CLAUDE.md and the Round 5 prompt use "any other Group A document the provider can read" for Option 1. | Replace with "any other document permitted under Option 1". |
| C7 | The card is authorised at instruct for the original total. A correction fee raises the total. | A second authorisation for the revised total is requested when the client approves it. Nothing is taken before Approve. If the case is declined or lapses, both authorisations are released. Design interpretation. |
| C8 | The platform fee is 69 pounds plus VAT per referred case. She writes "our standard 69 pounds plus VAT" in the correction flow. | One 69 pound fee per referred or B2C case, not per correction. The correction add-on goes wholly to the ACSP. Own-client cases still carry no 69 pounds. Design interpretation. |

## Design interpretations to confirm (short email questions for the client)

1. Codes: if someone types a code into a message anyway, is it right that the message is not sent until they edit it, rather than sent with a warning?
2. Corrections: who carries out the correction on the register and through which route? The demo assumes the ACSP does it outside the platform (Route B filing is held option O2), and the platform only tracks the status and the date the register was corrected. Is that right, and does it use the same "ACSP04" form that is still unclear (P5)?
3. Corrections: when a Referral Partner pays with an Agent Payment Code, who pays the correction add-on? The demo shows the client paying it, marked "Pending your decision".
4. Corrections: while the client has not yet approved the revised total, a Referral Partner would see "Further information required". While the ACSP is correcting, "In progress". Is that acceptable, or should there be a new status?
5. Expired passports: after TrustID's reply, does H1 stay as decided?
6. Option 2: does the provider's manual review replace the ACSP-run trained check, or sit alongside it?
7. Payments: should an ACSP with payments not yet active be excluded from allocation and from referral matching? The demo assumes yes.

## Option 1 and Option 2 document lists from her TrustID email (for the configurable eligibility data)

Option 1, as she listed them: a biometric or machine readable passport, or an Irish passport card; a UK, Channel Islands, Isle of Man or EU photocard driving licence (full or provisional); an identity card with biometric information from the EU, Norway, Iceland or Liechtenstein; a UK biometric residence permit; a UK biometric residence card; a UK Frontier Worker permit; an eVisa. Her email notes passports up to 6 months expired and BRPs up to 18 months expired, which is the open point C3.

Option 2 Group A: passport or Irish passport card; EU, Norway, Iceland or Liechtenstein identity card with biometric information; UK BRP; UK BRC; UK accredited PASS card; UK or EU driver digital tachograph card; UK, Channel Islands, Isle of Man or EU photocard driving licence; UK HM Forces ID card; UK HM Armed Forces Veteran card; UK Frontier Worker permit; photographic work permit; photographic immigration document; photographic visa; UK, Channel Islands or Isle of Man firearms licence; another photographic ID on PRADO.

Option 2 Group B: birth or adoption certificate; marriage or civil partnership certificate; non-photographic immigration document, visa or work permit; bank or building society statement; UK local authority or social housing rental agreement (current address); mortgage statement (current address); UK council tax statement (current address); utility bill (current address); insurance policy (current address).

## Not demo items, for awareness

- TrustID contract: she is waiting for a corrected contract and has had no reply to two emails. Halil said he would chase.
- The GitHub fine-grained token used for the demo expires about 31 October (Halil told her on 24 October).
- Stripe: Halil offered to set it up together on Monday 26 October. No rush before late November.
