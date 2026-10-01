import type { PlaceholderSpec } from './ScreenPlaceholder'

export const placeholderSpecs = {
  b2c: {
    eyebrow: 'Evidence One Verify',
    title: 'Verify my identity',
    summary: 'For directors and PSCs who come to Evidence One directly. Allocated to one of our ACSPs.',
    planned: ['Find your company on the register', 'Allocation to an ACSP', 'Continue into the app journey'],
  },
  acspQueue: {
    eyebrow: 'Evidence One Compliance',
    title: 'Review queue',
    summary: 'Cases waiting for an ACSP reviewer, with SLA countdowns and AI flags.',
    planned: ['36-hour SLA countdown on each case', 'Route, risk flags and allocation', 'B2C cases allocated to this ACSP'],
  },
  acspCase: {
    eyebrow: 'Evidence One Compliance',
    title: 'Case review',
    summary: 'Evidence, identity checks, PEP and sanctions, AI observations and the reviewer decision.',
    planned: ['Register comparison with any mismatch highlighted', 'Approve, Request info or Decline with reason codes', 'Register mismatch opens a Route B correction'],
  },
  acspSubmit: {
    eyebrow: 'Evidence One Compliance',
    title: 'Submit to Companies House',
    summary: 'A submission-ready pack, the handoff to GOV.UK One Login and recording the personal code.',
    planned: ['Every field ready to copy', 'Continue to GOV.UK One Login', 'Record the outcome and personal code'],
  },
  acspFilings: {
    eyebrow: 'Evidence One Compliance',
    title: 'Filings',
    summary: 'Route B tasks, including ACSP04 register corrections that unblock paused verifications.',
    planned: ['Open ACSP04 correction tasks', 'Mark the register as updated to resume Route A'],
  },
  record: {
    eyebrow: 'Evidence One File',
    title: 'Verification record',
    summary: 'The verification statement, retention date and the immutable audit trail.',
    planned: ['Verification statement with the attribution wording', 'Retention expiry 7 years from the decision', 'Hash-chained audit timeline and PDF export'],
  },
  admin: {
    eyebrow: 'Platform administration',
    title: 'ACSPs and allocation',
    summary: 'ACSPs on the platform, B2C allocation and remuneration.',
    planned: ['ACSP list', 'B2C allocation shares', 'Remuneration per ACSP'],
  },
} satisfies Record<string, PlaceholderSpec>
