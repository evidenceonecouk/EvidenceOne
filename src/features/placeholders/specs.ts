import type { PlaceholderSpec } from './ScreenPlaceholder'

export const placeholderSpecs = {
  agentDashboard: {
    eyebrow: 'Agent portal',
    title: 'Client companies',
    summary: 'Every lodged company with its directors and PSCs, their verification status and AI flags.',
    planned: [
      'Status chips: Verified, In progress, Not started, Expired, Reverification due',
      'AI flags summary across the portfolio',
      'Switch between an Agent with ACSP status and one without',
    ],
  },
  agentLookup: {
    eyebrow: 'Agent portal',
    title: 'Companies House lookup',
    summary: 'Search the live register, see officers and PSCs, and connect a company to the portal.',
    planned: ['Live search through the Companies House proxy, with a fictional fallback', 'Company profile with officers and PSCs', 'Connect company to portal'],
  },
  agentCompany: {
    eyebrow: 'Agent portal',
    title: 'Company profile',
    summary: 'Directors and PSCs from the register, with their verification status.',
    planned: ['Register association for each person', 'Select people to invite'],
  },
  agentInvite: {
    eyebrow: 'Agent portal',
    title: 'Bulk invite',
    summary: 'Invite several directors and PSCs at once, pre-filled from the register.',
    planned: ['Review pre-filled details', 'Pay myself or Agent Payment Code', 'Every invite written to the audit trail'],
  },
  agentInvites: {
    eyebrow: 'Agent portal',
    title: 'Invites',
    summary: 'Every invite sent, its status and its audit entry.',
    planned: ['Sent, opened, accepted, amendment requested and expired invites'],
  },
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
