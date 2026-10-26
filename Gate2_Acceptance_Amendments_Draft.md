# Gate 2 acceptance criteria: proposed amendments (draft)

Prepared 26 October 2026 for Celik Yuce to review before replying to Anastasiia. This is draft wording only. It has not been checked against the current text of the Implementation Plan LAB-2026-09-003, so read each line against the plan before using it. Criterion numbers are the ones she used in her email of 23 October 2026 (18:18).

Points to settle before sending anything:

- The Gates 2 to 5 Agreement LAB-2026-10-001 is out for signature by Friday 30 October. Check whether the acceptance criteria are incorporated by reference to the plan. If they are, a revised plan is enough. If not, say how the amendments are recorded.
- Halil told her on 23 October he would look closely at her amendments on the 24th and reply. As of 26 October no reply to the amendments is in the mailbox. A short, warm reply is due.
- Her emails are short; keep the reply short and put the detail in the revised plan, with the changed passages highlighted in pale yellow and a "What has changed in this revision" section, as the project rules require.

## Proposed wording by criterion

**G2-02 ACSP onboarding.** Add: "Payment onboarding. During registration the ACSP selects Connect payments. The payment provider's secure onboarding collects the business, representative and payout information and confirms whether the connected account is eligible to receive payments and payouts. Evidence One activates payment functionality for the ACSP only when both the payment provider's requirements and Evidence One's ACSP approval are satisfied. Evidence One does not collect or store the ACSP's bank account credentials. This criterion is subject to the payment provider's confirmation of the connected-account model."

**G2-07 Document eligibility.** Replace "any other Group A document" with "any other document permitted under Option 1". Add: "The document eligibility rules are held as configurable settings, changed only through the rule set approval process, so that changes to Companies House requirements do not need redevelopment." Group A and Group B remain Option 2 classifications.

**G2-08 and G2-09 Provider integration and optional checks.** Finalisation of the expired passport, non-biometric passport, manual document review, optional address check, PEP and sanctions screening and pricing elements is deferred until the identity provider has answered the client's questions. The demo keeps the decided behaviour meanwhile. The core identity branch (document validation, facial recognition, liveness, chip reading where applicable) is separate from the optional address and PEP and sanctions checks, which each ACSP enables separately.

**G2-10 Register discrepancies and G2-13 corrections.** Add: "Where the ACSP determines that a discrepancy requires a correction, the ACSP may raise a correction fee on top of the standard verification fee. When the client approves the revised total, the ACSP carries out the correction (expected 24 to 48 hours) and the case remains pending. When the register has been corrected the ACSP returns to the case and presses Approve, at which point the payment is taken through the payment provider: the ACSP's verification fee and correction fee to the ACSP, and the Evidence One platform fee of 69 pounds plus VAT on referred cases. The ACSP then makes the verification statement to Companies House, the client receives the personal code from Companies House by email, and on the next day confirms to Evidence One that it has arrived." Note for Halil: confirm with the client who carries out the correction and by which route, and the questions listed in `Client_Amendments_2026-10-23.md`.

**G2-12 and G2-18 Codes and messaging.** Replace the text that allows clients to pass codes through case messages with: "The messaging facility is for verification-related communication and is not used to transmit Companies House personal codes, company authentication codes, passwords or other access credentials. A clear warning is displayed. Evidence One does not request, collect or intentionally store these codes. Companies House sends the personal code directly to the individual. Where an ACSP needs a code for a subsequent filing, the ACSP and client arrange its transmission independently. Evidence One records that the individual has confirmed receipt of the personal code, without asking them to disclose it. Evidence One does not provide a dedicated code-sharing feature in Gate 2." This also reconciles G2-12 with G2-18, which the client asked for.

**G2-14 Option 2 fallback.** Replace with: "Option 2 is handled through the identity provider's manual document review service, subject to the provider confirming that it can support the relevant Companies House requirements. The provider performs the supported document checks and returns its findings to Evidence One. The assigned ACSP completes any additional checks required and retains responsibility for the final verification decision, as in Option 1."

## Proposed addition: end-to-end acceptance scenarios

Add to the Gate 2 acceptance section: "Gate 2 is accepted against the following end-to-end scenarios, run in the test environment. Each forms part of the formal acceptance testing."

1. Two independent ACSPs are registered and approved through the administrator portal.
2. Separate clients and verification cases are assigned to each ACSP.
3. The provider verification journey is completed, including document validation, facial recognition and liveness checks.
4. The ACSP reviewer journey is demonstrated, including approval, request for further information and rejection, with the required authentication controls.
5. Neither ACSP can access, view or modify the other ACSP's records, shown by screen, by direct link and by direct request, with the refusal recorded in the audit trail.
6. A failed verification and the applicable Option 2 fallback process are demonstrated, subject to the provider's confirmed capabilities.
7. The verification audit trail is generated and exported.
8. The Companies House submission handoff is demonstrated and the confirmation recorded.

Dependency to flag to her: scenarios 3 and 6 need the identity provider contract signed and the sandbox open. Her message of 26 October says the contract still needs correcting before she signs, so the Gate 2 timetable for those two scenarios depends on that.

## Suggested short reply (for Celik to adapt)

Hi Anastasiia,

Thank you for going through the Gate 2 criteria so carefully. I will reflect your amendments in the revised plan, with the changes highlighted. The ones that depend on TrustID (Option 2, expired and non-biometric passports, the optional checks) I will mark as subject to their confirmation, and I will keep the end-to-end scenarios you listed as part of the formal acceptance testing.

I am updating the demo to match and will send it over once I have checked it through. I have two or three small questions on the correction flow and will send them separately.

Kind regards,
Celik
