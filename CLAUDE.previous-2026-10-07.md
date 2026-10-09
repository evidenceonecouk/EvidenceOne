# Evidence One: interactive prototype

Read this whole file before doing anything. It is the persistent context for this repo. Last updated 7 October 2026, after the client's restructuring email of 6 October (confirmed final) and the reissued Gate 1 documents of 7 October.

## What this is

Evidence One is an identity verification and corporate compliance platform for UK Companies House identity verification (IDV). It sits **alongside the free GOV.UK ID Check app**, not against it. It serves the cases GOV.UK does not handle well:

- individuals who get stuck or fail in the GOV.UK app;
- individuals without a compatible phone or a chipped document;
- Referral Partners and ACSPs who manage several directors and PSCs and need one place to track status, send invites and keep an audit trail;
- people who need help in their own language, or guided help with additional and supporting documents.

The professional portal and the ACSP-led route are the commercial centre of the product. A direct-to-consumer app matters much less.

Labters Ltd (London) is designing and building the platform for the client, a solicitor who is a registered ACSP. Gate 1 (discovery and architecture) is complete and under her review. The full platform is not built yet.

**This repo is a clickable demo, not the product.** The client shows it to sponsors and partners who will not read the Gate 1 documents; they need to see a product. A competing vendor showed her a working demo (https://acsp.liquidwork.app/#/lookup), so ours must be clearly better: more complete, more polished, more accurate to how the platform will actually work.

## Hard rules

- **Synthetic data only.** No real people's personal data, no real identity documents, ever. Fictional people, companies, ACSP firms and Referral Partners. The only live data allowed is the public Companies House company search via `/api/companies/search` and `/api/companies/profile` (public register data), and the app must fall back to mock data when that API is unavailable.
- **There is no Evidence One mobile app.** The individual's journey runs in the browser on desktop and on mobile. Never write "download the app", never show an app store badge, never describe a React Native app. The phone frame in the demo represents a **mobile browser**, not an app, and the desktop browser view is a first-class alternative.
- **The ACSP is the service provider; Evidence One is the technology provider.** The individual instructs a named ACSP. That ACSP takes the payment, makes the verification statement, appears on the register and stays fully responsible. Evidence One is presented as the ACSP's technology provider on every screen, email, invoice and record.
- **The platform prepares, evidences and records. It does not verify.** Never write "Evidence One has verified your identity". Always: "Your identity verification is being conducted by [ACSP name] using the Evidence One platform."
- **AI is advisory only.** AI checks supporting evidence and compares details against the Companies House register, and it raises flags. It never approves or declines, and it is never applied to the identity document itself. The only decision is the ACSP reviewer's approve, request information or decline. Label AI output "AI observation. Advisory only." with a model tag. ACSP matching and every rule are deterministic and never use AI.
- **Do not imitate GOV.UK or Companies House branding.** No crown, no GOV.UK typeface, no lookalike GOV.UK or WebFiling pages. Represent every GOV.UK step as a clear handoff plus a simulated return through an Evidence One-branded interstitial.
- **Evidence One never asks for, stores or uses anyone's GOV.UK One Login credentials.** One Login is the ACSP's own login to Companies House services. It is never a way to sign in to Evidence One.
- **Accessibility: WCAG 2.2 AA.** Users skew older. 16px minimum body, 18px preferred, strong contrast, visible focus states, real buttons and labels, keyboard navigable.
- **Copy style:** UK English, plain and calm, no em-dashes, no emojis, no hype.
- **No version numbers** visible anywhere in the UI. Rule set version labels such as "2026.1" are data and are fine.
- **The personal code is never collected or shown.** Companies House emails it directly to the individual. The platform records the Companies House verification reference instead. Final wording: "Companies House will email the personal code directly to [name]. Evidence One does not receive or keep it."
- **Journey order (individual):** open invite, confirm email (one-time code) and mobile (SMS code), confirm or amend register details, personal information (Step 1), **instruct the named ACSP** (see who will verify you, their fee, and that Evidence One is their technology provider), **payment to that ACSP**, identity document, identity checks, supporting evidence only if requested, submit. If the register already shows the person as verified (REG-04), say so calmly before payment and offer continue or stop. A B2C client is matched and allocated to an ACSP before instructing and paying.
- **One identity document first. Supporting evidence only on a trigger** (ADDL-01 to ADDL-03: document expired beyond its exception; documents do not confirm the 12-month address history; name change), worded "We need one supporting document", never as a second identity document. Accepted: bank or credit card statement with recent transactions, utility or council tax bill, insurance policy document showing the home address, evidence of recent passport use; dated within `supporting_evidence_months` (3).
- **Chip reading.** A browser cannot read a passport chip. Where the identity provider offers chip reading, it happens in **the provider's own flow on the person's phone** (QR code or link handoff, then return), clearly labelled as the certified identity provider, never as Evidence One. A chipped passport whose chip is not read cannot pass Option 1 (IDVT-01), so the journey then offers another Option 1 document (UK photocard driving licence in the browser) and only then the Option 2 fallback. Whether chip reading stays a minimum requirement is pending the client's decision, so it is a decision setting on the Rules page (see below).
- **Sign-in:** individuals by one-time code or passkey; professionals by passkey or authenticator app. Step-up ("Confirm it's you", passkey or authenticator code, no SMS) on approve, decline, export, starting a submission and granting evidence access, with the step-up reference in the audit entry.
- **Rejection message**, shown to the individual exactly: "Rejection reason: It is the person's responsibility to prove that you are who you say you are. You will need to get documents to be able to verify your identity for Companies House."
- **Money: agency model.** The client pays the named ACSP. Evidence One collects the payment only as the ACSP's **disclosed agent**, by split payment, with the ACSP as merchant of record and the funds going to the ACSP's own payment account. Each ACSP sets its own professional fee (a seed ACSP may charge £49; there is no platform-wide £49 price any more). Evidence One charges the ACSP a **platform fee of £69 plus VAT per referred case**, deducted automatically or invoiced, or a **monthly subscription** whose price is not set ("Price not set" in the UI, configurable by Admin). The ACSP's invoice to the client is issued in the ACSP's name with its VAT number, generated by the platform on its behalf. Show the payment provider generically ("secure payment provider"), never a real brand logo.
- **Four separate fee types**, never merged: ACSP Professional Fee, Referral Commission, Platform Fee, Marketplace Commission.
- **Referral commissions are off at launch** (`referral_commissions` = Off). The regulatory switch, the disclosure and the consent records exist and can be demonstrated by an Admin switching commissions on in a draft rule version.
- **Referral Partners see status only** (Invited, In progress, Further information required, Completed), never documents or evidence, unless the ACSP grants evidence access explicitly (a separate permission, off by default, step-up, expiry, every view audited). A Referral Partner is never presented as the verifying ACSP. Agent Payment Codes are single-use and tied to one invite.
- **Rules page and rule set** (`src/data/rules.ts`, evaluated by `src/lib/rules.ts`): every rule has an ID, a plain-English condition, one of six outcomes (Pass, Flag, Mandatory decision, Request, Halt, Block) and a source code (S, R, CA, ICO, C, Design). Rules are evaluated deterministically and never by AI; no rule declines a case. Reviewers read the page; the Admin proposes changes, which always create a new draft version; Admin (second approver) publishes with an effective date and the old version becomes Superseded. Every publish is audited. Decided cases keep the version applied at their decision. Approve stays disabled until no Block or Halt is open and every Mandatory decision has a recorded decision with a reason. Escalate appears only when `escalate_enabled` is on. Footer: "Rules are evaluated the same way every time. No rule is ever evaluated by AI."
- **ACSP Copilot** (`src/lib/copilot.ts`): calls no AI service in the demo; answers are built deterministically from the case and rules data, every statement carries a citation chip, header "AI assistant. Advisory only. Answers come from this case and your approved materials." Regulatory questions the data cannot support: "Not supported by approved sources. This is a matter for your professional judgement." Requests to decide: "I can't make decisions. Only you can approve, request information or decline." Drafts: "Draft, not sent. Review before sending". Every exchange audited.
- **Language help** (`src/lib/languageHelp.ts`): deterministic in the demo. Pre-written guidance in a few languages with "English is the version of record" and "AI translation. Advisory only." labels; the supporting-document helper answers only from the approved list of accepted documents and refuses anything else.

## Stack

- Vite + React + TypeScript, React Router (BrowserRouter; `vercel.json` rewrites all non-`/api` paths to `index.html`).
- Tailwind CSS, lucide-react, the local component set in `src/components`. No heavy UI kit.
- State: the single demo store in `src/store`, seeded from `src/data/`, persisted to localStorage, with a visible "Reset demo" action that restores everything, including rules, onboarding, billing and monitoring state.
- Vercel serverless functions in `api/companies/` proxy Companies House search and profile. The key is the server-only env var `COMPANIES_HOUSE_API_KEY` (never `VITE_` prefixed).
- Deployed on Vercel from `main`. Keep `npm run build` passing with zero TypeScript errors before every push.

## Design direction

- Trust product: how it looks is evidence. Calm, precise, professional, modern fintech compliance tool.
- Colours: use the existing Evidence One logo and brand colours. Primary blue `#1D70B8` (5.17:1 on white), green `#0F7B3F` (5.35:1). Never yellow text on white. Neutral greys must pass AA for any text.
- Decision colours: green = Approve, amber = Request information, red = Decline. Never colour alone; always a label and icon.
- Desktop-first portal for Referral Partners, ACSPs and Admin. The individual's journey is shown in a mobile browser frame with a desktop browser view alongside (a toggle), because many target users are on a laptop or have an older phone.

## Domain model (keep terminology exact)

- **Two routes.** Route A: Verifications. Route B: Filings (including register corrections). Never mention a third route.
- **Organisations and roles.** ACSP and Referral Partner are **separate organisation types and permission models**. One person can hold memberships in both, acting through one at a time; the roles never merge.
  - **ACSP (supply side):** registered Companies House ACSP and AML-supervised. Approves, requests information or declines. Has reviewers and an ACSP administrator. Structured profile: regulatory status (ACSP reference, AML supervisor and number, last status check, next reconfirmation due), verification authority, cases accepted (residence countries, excluded jurisdictions, document types and issuing countries, non-biometric documents, languages, directors, PSCs, proposed directors, higher-risk cases), capacity per day, week and month, accepting new cases, target turnaround, standard and enhanced fees, currency, evidence-retention choice, connected payment account, plan (per-case fee or subscription).
  - **Referral Partner (demand side):** accountant, solicitor or law firm, corporate service provider, formation agent, tax adviser, consultant, family office, introducer; may be overseas. Brings clients and portfolios, sends invites, may pay on the client's behalf with an Agent Payment Code, sees status only. Never decides.
  - **Individual (director or PSC)** invited by a Referral Partner or ACSP; **B2C client** who comes directly and is matched and allocated to an ACSP; **Admin** and **Admin (second approver)** for the platform.
- **Option 1** (certified identity provider, browser-first) is the default. **Option 2** (trained human check) is a fallback only, when Option 1 cannot support the person's document.
- **Identity checks shown in a case:** document authenticity, liveness, face match, PEP and sanctions screening, and the chip result where the provider's own flow read one. The provider is unnamed ("certified identity provider").
- **Register association at entry** and **register comparison:** details must exactly match the register (after normalisation of case, spacing, hyphens and apostrophes). A mismatch halts Route A and raises a register correction task in Route B; Route A resumes once the register matches. Corrections to a submitted verification use ACSP04, never a resubmission.
- **Address:** 12-month history; evidence for the current address only on a trigger, dated within 3 months.
- **Documents:** cancelled or replaced documents are flagged to the reviewer by AI, never auto-rejected.
- **Submission to Companies House (Route A):** after approval the ACSP is prompted to sign in with **its own** GOV.UK One Login and submit through the Companies House service. The platform prepares a submission workspace (every field in service order, copy and done ticks), hands off through an Evidence One-branded interstitial and records the verification reference. States APPROVED, SUBMISSION_STARTED, SUBMITTED, CONFIRMED.
- **Route B filings:** the platform prepares and checks the filing, then hands off to the **instructing ACSP's own WebFiling account**, signed in with its own One Login. The ACSP enters the company authentication code itself; the platform never holds it. Outcome recorded.
- **ACSP matching:** structured criteria (accepted residence country, document type and issuing country, role, languages, higher-risk acceptance, capacity left today, turnaround, accepting new cases, ACSP active and reconfirmed). The demo shows the criteria and the eligible ACSPs with reasons; an Admin allocates. Automatic matching is a later phase. Example query to demonstrate: "Ukrainian passport, resident in the UAE, English or Russian, capacity today, turnaround 24 hours or less."
- **ACSP status monitoring:** the platform checks each ACSP against what Companies House publishes (an opt-in list of ACSPs and a fortnightly ceased and suspended list; there is no API) and asks each ACSP to reconfirm its regulatory information every 12 months (proposed). A lapse or overdue reconfirmation is flagged, pauses new allocation (ACSP-10, ACSP-11, MATCH-01), flags every case that ACSP verified for follow-up (ACSP-12), and halts open cases for reallocation (ACSP-13, proposed).
- **Referral records** store exactly: referral_partner, regulator, commission_type, commission_amount, disclosure_version, disclosed_at, consent_required, consent_at, payment_at. Disclosure shown to the customer when commissions are on: "Referral arrangement disclosure. [Partner] introduced you to Evidence One and may receive £[amount] if you purchase this service. This commercial arrangement does not increase the price you pay." followed by acknowledgement or consent as the regulator requires.
- **Billing:** per ACSP, monthly statement reconciling case by case gross received, platform fee and net paid out; client invoices in the ACSP's name; Evidence One invoices to the ACSP per case or consolidated monthly.
- **Retention:** 7 years from the reviewer decision (`decided_at`), failed and abandoned cases too. Each ACSP controls its own verification records; Evidence One processes them on its behalf, and each ACSP's records are kept separate.
- **Audit trail:** append-only, hash-chained, one chain per ACSP. Show it as an immutable event timeline with short hashes.
- **Review target:** 36 hours (`review_target_hours`), shown to reviewers only.

## Demo structure

A persona switcher in the top bar: **Referral Partner**, **ACSP** (reviewer and firm administrator), **Individual**, **B2C client**, **Admin**, **Admin (second approver)**. A "Guided demo" mode steps through the story with short captions.

Screens, in story order:

1. **Landing page.** Evidence One alongside GOV.UK: "Verify with an ACSP, in your browser, with help in your language". Entry points: "Verify my identity" (B2C), "Had trouble with the GOV.UK app?", "For Referral Partners", "For ACSPs". No app wording anywhere.
2. **Join as a Referral Partner.** Multi-step onboarding (organisation, regulatory position, client portfolio, referral workflow and team permissions, commercial arrangements, data and authority, declarations), the "Do you wish to receive payment for referrals?" switch and regulator, and a clear statement that the partner is not the verifying ACSP.
3. **Join as an ACSP.** Multi-step onboarding (identity and regulatory status, who performs verifications, cases accepted, commercial preferences and payment account, evidence and retention, declarations), ending in "Pending platform approval".
4. **Referral Partner portfolio.** Connected companies; directors and PSCs with status chips and unverified, expired and due flags; invite log.
5. **Company lookup and connect.** Live search via proxy with mock fallback, company profile with officers and PSCs, "Connect company".
6. **Bulk invite.** Pre-filled from the register, choose the instructing ACSP (or let the platform match), choose who pays (client, or Partner with an Agent Payment Code), send. Audited.
7. **Individual: open invite, confirm details, personal information, instruct the ACSP, pay** (mobile browser frame with desktop toggle; language selector).
8. **Individual: identity checks** in the browser: document capture, liveness, face match; optional handoff to the provider's own chip flow; driving licence route; Option 2 fallback.
9. **Individual: supporting evidence** only on trigger, with the supporting-document helper.
10. **Individual: submitted and status tracker**, with correct attribution.
11. **B2C: start, matching and allocation**, then the same journey from step 7.
12. **ACSP review queue** with SLA countdown, route, flags and allocation source.
13. **ACSP case review**: evidence, identity checks, PEP and sanctions, AI observations, rule results, decision with reason codes; mismatch path creates a Route B correction task; evidence access grants for the Referral Partner.
14. **Submit to Companies House** (Route A handoff) and **Route B filing handoff** to the ACSP's own WebFiling.
15. **Verification record**: attribution, decision timestamp, kept until +7 years, biometric deletion within 30 days, rule set version, verification reference, audit trail, export behind step-up. No personal code.
16. **ACSP billing**: client invoices issued in the ACSP's name, Evidence One platform-fee invoices, monthly statement, plan.
17. **Admin**: ACSP and Referral Partner approvals, matching and allocation, ACSP status monitoring and reconfirmation, fees and subscription plans, referral commissions setting, compliance dashboard, audit, retention, users and roles.
18. **Rules**: rule set, parameters, decision settings and version history, with propose, approve and publish.

Seed data: 3 fictional ACSP firms with different criteria (one UK-only English-speaking sole practitioner; one law firm accepting overseas clients with Russian and Ukrainian support and a 24-hour turnaround; one whose status has lapsed); 2 fictional Referral Partners (a UK accountancy practice and an overseas corporate service provider in Dubai, one of whom is also an ACSP to show the two roles); 3 fictional companies (a small family company, a growing tech company with several directors and a PSC, and Corrigan Marine Services Ltd with a register mismatch); 8 to 12 fictional people in mixed statuses, including a Ukrainian passport holder resident in the UAE.

## Working conventions

- Small, reviewable commits. Run `npm run build` before pushing.
- Keep components small and typed. Mock data and types in `src/data/` and `src/types/`.
- Prefer realistic micro-detail (timestamps, references like `EO-2026-000123`, invoice numbers, SLA timers, audit hashes) over lorem ipsum.
- When unsure about a regulatory detail, follow this file and the Gate 1 documents; regulatory interpretation belongs to the client, so do not invent new rules. Where the client has not decided, show a "Pending your decision" badge rather than choosing.
