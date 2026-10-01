import type { PlaceholderSpec } from './ScreenPlaceholder'

export const placeholderSpecs = {
  admin: {
    eyebrow: 'Platform administration',
    title: 'ACSPs and allocation',
    summary: 'ACSPs on the platform, B2C allocation and remuneration.',
    planned: ['ACSP list', 'B2C allocation shares', 'Remuneration per ACSP'],
  },
} satisfies Record<string, PlaceholderSpec>
