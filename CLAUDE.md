# Evidence One: interactive prototype

Read this whole file before doing anything. It is the persistent context for this repo.

## What this is

Evidence One is an identity verification and corporate compliance platform for UK Companies House identity verification (IDV). Its users are Authorised Corporate Service Providers (ACSPs), the professionals they work with, and the company directors and PSCs (persons with significant control) who must verify their identity.

Labters Ltd (London) is designing and building the platform for the client, a solicitor who is a registered ACSP. We are at the end of Gate 1 (discovery and architecture). The full platform is not built yet.

**This repo is a clickable demo, not the product.** The client must show the platform to people who will not read a long implementation plan; they need to see a product. A competing vendor showed her a working demo (https://acsp.liquidwork.app/#/lookup), so ours must be clearly better: more complete, more polished, more accurate to how the platform will actually work.

## Hard rules

- **Synthetic data only.** No real people's personal data, no real identity documents, ever. Fictional people and fictional companies for the story. The only live data allowed is the public Companies House company search via `/api/companies/search` (company names, numbers, officers are public register data), and the app must fall back to mock data when that API is unavailable.
- **The platform prepares, evidences and records. It does not verify.** Never write "Evidence One has verified your identity". Always: "Your identity verification is being conducted by [ACSP name] using the Evidence One platform." Apply this everywhere: UI copy, emails shown in the demo, the verification statement, PDFs.
- **AI is advisory only.** AI checks documents at upload and compares details against the Companies House register, and it raises flags. It never approves or declines. The only human decision is the ACSP reviewer's approve, request info or decline. Show AI output as "AI observations" with clear advisory labelling.
- **Do not imitate GOV.UK or Companies House branding.** No crown, no GOV.UK typeface, no lookalike GOV.UK pages. Represent GOV.UK One Login steps as a clear handoff ("Continue to GOV.UK One Login") plus a simulated return, never as a fake GOV.UK screen.
- **Accessibility: WCAG 2.2 AA.** Users skew older. Large, readable type (16px minimum body, 18px preferred), strong contrast, visible focus states, real buttons and labels, keyboard navigable.
- **Copy style:** UK English, plain and calm, no em-dashes, no emojis, no hype.
- **No version numbers** visible anywhere in the UI. Rule set version labels such as "2026.1" are data and are fine.
- **The personal code is never collected or shown under Route A.** Companies House emails it directly to the individual. The platform records the Companies House verification reference instead. Final wording: "Companies House will email the personal code directly to [name]. Evidence One does not receive or keep it."
- **Journey order:** open invite, confirm email (one-time code) and mobile (SMS code), confirm or amend register details, personal information (Step 1), **payment**, identity document, chip read, selfie, supporting evidence only if requested, submit. Payment comes after personal information and before the identity checks. If the register already shows the person as verified (REG-04), say so calmly before payment and offer continue or stop.
- **One identity document first. Proof of address only on a trigger** (rules ADDL-01 to ADDL-03), worded "We need one supporting document", never as a second identity document. Accepted: bank or credit card statement with recent transactions, utility or council tax bill, insurance policy document showing the home address, evidence of recent passport use; dated within `supporting_evidence_months`.
- **Sign-in:** individuals by one-time code or passkey; professionals by passkey or authenticator app. Never mention GOV.UK One Login as a way to sign in to Evidence One. Step-up ("Confirm it's you", passkey or authenticator code, no SMS) on approve, decline, export and starting a submission, with the step-up reference in the audit entry.
- **Rejection message**, shown to the individual exactly: "Rejection reason: It is the person's responsibility to prove that you are who you say you are. You will need to get documents to be able to verify your identity for Companies House."
- **Rules page and rule set** (`src/data/rules.ts`, evaluated by `src/lib/rules.ts`): every rule has an ID, a plain-English condition, one of six outcomes (Pass, Flag, Mandatory decision, Request, Halt, Block) and a source code (S, R, CA, ICO, C, Design). Rules are evaluated deterministically and never by AI; no rule declines a case. Reviewers read the page; the Admin proposes changes, which always create a new draft version (never edit the current one); a different persona, Admin (second approver), publishes with an effective date and the old version becomes Superseded. Every publish is audited. Decided cases keep the version applied at their decision; open cases use the version in force. Approve stays disabled until no Block or Halt is open and every Mandatory decision has a recorded decision with a reason. Escalate appears only when `escalate_enabled` is on. Footer: "Rules are evaluated the same way every time. No rule is ever evaluated by AI."
- **ACSP Copilot** (`src/lib/copilot.ts`): calls no AI service in the demo; answers are built deterministically from the case and rules data. Every statement carries a citation chip that highlights its source on screen. Header: "AI assistant. Advisory only. Answers come from this case and your approved materials." Regulatory questions the data cannot support get "Not supported by approved sources. This is a matter for your professional judgement." Requests to decide get "I can't make decisions. Only you can approve, request information or decline." Drafts are marked "Draft, not sent. Review before sending". Every exchange is written to the audit trail with the question, answer, sources and a model label.
- **AI observations** are labelled "AI observation. Advisory only." with a model tag, sit against the step they relate to and name the rule they explain. AI is never applied to the identity document itself; only to supporting evidence and comparison results.
- **Agents see status only** (Not started, In progress, Awaiting information, With the ACSP, Verified, Not completed), never documents or evidence. Agent Payment Codes are single-use and tied to one invite.

## Stack

- Vite + React + TypeScript (already scaffolded). React Router (BrowserRouter; `vercel.json` already rewrites all non-`/api` paths to `index.html`).
- Tailwind CSS for styling, lucide-react for icons. Small local component set (Button, Card, Badge, StatusChip, Table, Stepper, Modal, Drawer, Toast). Do not pull in a heavy UI kit.
- State: a single demo store (React context or zustand) seeded from `src/data/`, persisted to localStorage, with a visible "Reset demo" action.
- Vercel serverless function at `api/companies/search.ts` proxies the Companies House search. The key is the server-only env var `COMPANIES_HOUSE_API_KEY` (never `VITE_` prefixed). `api/tsconfig.json` gives that folder Node types. Add further proxies the same way if needed (company profile, officers, PSCs).
- Deployed on Vercel from `main`. Keep `npm run build` passing with zero TypeScript errors before every push.

## Design direction

- Trust product: how it looks is evidence. Calm, precise, professional. Think modern fintech compliance tool, not a marketing template.
- Colours: primary blue `#1D70B8` (5.17:1 on white), green `#0F7B3F` (5.35:1). Never yellow text on white (1.33:1, fails). Yellow only as a filled block with dark text, if at all.
- Decision colours: green = Approve, amber = Request info, red = Decline. Never rely on colour alone; always pair with a label and icon.
- Neutral greys must still pass AA for any text.
- Desktop-first web portal for Agents and ACSP reviewers. The individual's journey is shown inside a phone frame (it represents our React Native app) with a desktop browser fallback.

## Domain model (keep terminology exact)

- **Two routes.** Route A: Verifications (identity verification of individuals). Route B: Filings (Companies House filings, including register corrections). Never mention a third route.
- **User types:** ACSPs (can approve or decline), Agents with ACSP status (sole traders, accountants, law firms, formation agents, TCSPs: can approve, decline, or refer), Agents without ACSP status (family offices, introducers: can only refer), invited directors / PSCs, and B2C clients (members of the public who come directly and are allocated to one of the platform's ACSPs).
- **Option 1** (digital verification by a certified IDVT provider) is the default. **Option 2** (trained human check) is a fallback only, shown only when Option 1 cannot support the person's document.
- **IDVT checks shown in a case:** passport NFC chip read (app only; impossible in a browser), document authenticity, liveness, face match against the document photo, PEP and sanctions screening. The provider is unnamed in the UI ("certified identity provider").
- **Register association at entry:** when a person is added, show the Companies House company they are associated with and whether they are a director or PSC.
- **Register comparison:** ID details must exactly match the register. A mismatch halts Route A, creates a correction task in Route B (form ACSP04 correction, never a resubmission), and Route A resumes once the register is updated.
- **Address:** 12-month address history; evidence needed for the current address only, dated within the last 3 months.
- **Documents:** cancelled or replaced documents are flagged to the reviewer by AI, never auto-rejected.
- **Fee:** flat £49 per verification. Payment options: Pay myself (card checkout, simulated) or Agent Payment Code (paid by an Agent, family office, introducer or corporate service provider).
- **Invites:** Agents connect a company from the register, then send bulk invites. Each invite is pre-filled from the register; the individual confirms or requests an amendment. An invite can carry a pre-authorised payment code. Every invite is logged in the audit trail.
- **Submission to Companies House:** after ACSP approval, the ACSP submits the verification through the Companies House service, signing in with their own GOV.UK One Login. No public API exists for this today, so the platform prepares a submission workspace (every field in service order, each with copy and done), hands off through an Evidence One-branded interstitial, and records the Companies House verification reference. States: APPROVED, SUBMISSION_STARTED, SUBMITTED, CONFIRMED. A submitted case cannot be submitted again; "Correct submitted details" prepares a correction pack against the original case and verification reference.
- **Retention:** records kept 7 years from the reviewer decision timestamp (`decided_at`). Failed and abandoned cases too.
- **Audit trail:** append-only, hash-chained. Show it as an immutable event timeline with short hashes.
- **Review target:** 36 hours (`review_target_hours`), shown to reviewers only as a countdown on review cases.

## Demo structure

A persona switcher in the top bar (Agent, ACSP reviewer, Individual, B2C client, Admin, Admin (second approver)) so a presenter can walk the whole story without logging in and out. A "Guided demo" mode that steps through the story with short captions is a strong differentiator; build it once the screens exist.

Screens, in story order:

1. **Landing page.** What Evidence One is, two entry points: "Verify my identity" (B2C) and "For professionals" (Agents and ACSPs). Attribution wording correct.
2. **Agent dashboard.** Lodged companies; per company, directors and PSCs with status chips (Verified, In progress, Not started, Expired, Reverification due). AI flags summary.
3. **Company lookup and connect.** Search Companies House (live via proxy, mock fallback), company profile with officers and PSCs from the register, "Connect company to portal".
4. **Bulk invite.** Select people, review pre-filled details, choose payment (Pay myself or Agent Payment Code), send. Audit entry created.
5. **Individual: open invite (phone frame).** Pre-filled details, confirm or request amendment, register association shown.
6. **Individual: identity check.** Passport NFC chip scan (animated, simulated), selfie liveness, face match. Option 2 only appears as a fallback path.
7. **Individual: address and evidence.** 12-month history, current-address evidence upload (dated within 3 months), AI upload check feedback.
8. **Individual: payment and submit.** £49 or payment code applied, confirmation with correct attribution wording, status tracker.
9. **ACSP review queue.** Cases with SLA countdown, route, risk flags, allocation (B2C cases allocated to ACSPs).
10. **ACSP case review.** Evidence, IDVT results, PEP and sanctions result, AI observations (document checks; register comparison with any mismatch highlighted), decision buttons (Approve / Request info / Decline) with reason codes. Mismatch path creates a Route B correction task.
11. **Submit to Companies House.** Submission workspace with copy buttons and done ticks, "Continue to GOV.UK One Login" handoff to an Evidence One interstitial, simulated return, record the verification reference. Correction flow for submitted cases.
12. **Verification record.** Verification statement (attribution wording, decision timestamp, "Kept until" +7 years, biometric deletion within 30 days, rule set version applied, verification reference), audit trail timeline with hashes, export as PDF behind step-up. No personal code.
13. **Admin (light).** ACSP list and B2C allocation, remuneration tracking per ACSP.
14. **Rules.** The Route A rule set, parameters, decision settings and version history, with propose, approve and publish across Admin and Admin (second approver).

Seed data: 2 to 3 fictional companies (for example a small family company, a growing tech company with several directors and a PSC, and a company with a register mismatch to show the Route B path). 6 to 10 fictional people in mixed statuses. One fictional ACSP firm and reviewer.

## Working conventions

- Small, reviewable commits. Run `npm run build` before pushing.
- Keep components small and typed. Mock data and types in `src/data/` and `src/types/`.
- Prefer realistic micro-detail (timestamps, reference numbers like `EO-2026-000123`, SLA timers, audit hashes) over lorem ipsum.
- When unsure about a regulatory detail, follow this file; regulatory interpretation belongs to the client, so do not invent new rules.
