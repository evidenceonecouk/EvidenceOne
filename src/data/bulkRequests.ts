import type { BulkRequest } from '@/types/domain'
import { DUBAI_PARTNER_ID, PRIMARY_PARTNER_ID } from './organisations'

/*
  Bulk / Bespoke Requests (option O4, included). Fictional. One request is
  already converted into linked cases; one is still being agreed, so the
  presenter can convert it live as the Platform Administrator.
*/

const DAY = 86_400_000
const HOUR = 3_600_000
const ADMIN = 'Marcus Adeyemi, Platform Administrator'

export const BULK_EXAMPLE =
  'I need 5 individual identity verifications, potentially with Companies House amendments, and I also need a corporate verification.'

export function seedBulkRequests(now = Date.now()): BulkRequest[] {
  const at = (offset: number) => new Date(now + offset).toISOString()
  return [
    {
      id: 'BR-2026-0003',
      partnerId: PRIMARY_PARTNER_ID,
      submittedBy: 'Rachel Fenwick, Fenwick & Shaw Chartered Accountants',
      submittedAt: at(-8 * DAY),
      request: BULK_EXAMPLE,
      status: 'converted',
      messages: [
        {
          id: 'brm-0003-1',
          from: 'admin',
          authorName: ADMIN,
          at: at(-8 * DAY + 3 * HOUR),
          body: 'Thank you. Which company is this for, and are all five people already on the register?',
        },
        {
          id: 'brm-0003-2',
          from: 'partner',
          authorName: 'Rachel Fenwick',
          at: at(-7 * DAY - 2 * HOUR),
          body: 'Lumenfield Technologies Ltd. Three directors are on the register now. Two proposed directors will be appointed next month, and the company itself needs a corporate verification.',
        },
        {
          id: 'brm-0003-3',
          from: 'admin',
          authorName: ADMIN,
          at: at(-6 * DAY - 4 * HOUR),
          body: 'Agreed. I will open cases for the three directors now with Harcourt Lane Solicitors LLP. The two proposed directors can be added once appointed. Amendments are noted as an additional service, and the corporate verification is added when Companies House publishes the final requirements.',
        },
      ],
      convertedAt: at(-6 * DAY),
      convertedBy: ADMIN,
      caseIds: ['EO-2026-000131', 'EO-2026-000132', 'EO-2026-000135'],
      additionalServices: [
        'Companies House amendments for Lumenfield Technologies Ltd, to be scoped with the instructing ACSP',
      ],
      corporateRequested: true,
    },
    {
      id: 'BR-2026-0004',
      partnerId: DUBAI_PARTNER_ID,
      submittedBy: 'Oliver Grant, Meridian Gulf Corporate Services',
      submittedAt: at(-20 * HOUR),
      request:
        'We look after Blue Harbour Trading Ltd. Please arrange identity verification for its directors, with Russian-speaking support where possible, and tell us what else is needed to update the register.',
      status: 'open',
      messages: [
        {
          id: 'brm-0004-1',
          from: 'admin',
          authorName: ADMIN,
          at: at(-6 * HOUR),
          body: 'Thank you. I can see the directors on the register. Do you want the case already under way included, or only the people not yet invited?',
        },
      ],
      caseIds: [],
      additionalServices: [],
      corporateRequested: false,
    },
  ]
}
