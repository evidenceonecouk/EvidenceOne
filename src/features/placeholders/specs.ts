import type { PlaceholderSpec } from './ScreenPlaceholder'

export const placeholderSpecs = {
  acspSubmit: {
    eyebrow: 'Evidence One Compliance',
    title: 'Submit to Companies House',
    summary: 'A submission-ready pack, the handoff to GOV.UK One Login and recording the personal code.',
    planned: ['Every field ready to copy', 'Continue to GOV.UK One Login', 'Record the outcome and personal code'],
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
