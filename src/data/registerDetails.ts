import type { ISODate } from '@/types/domain'

/*
  The rest of the public register record for the fictional companies: filing
  deadlines, recent filings, previous names and officer details. Static, so it
  is not part of the saved demo state. Live companies get the same shape from
  the Companies House proxy.
*/

export interface DemoFiling {
  date: ISODate
  type: string
  category: string
  description: string
}

export interface DemoRegisterDetails {
  accountingReference: { day: number; month: number }
  accounts: {
    lastMadeUpTo?: ISODate
    lastType?: string
    nextMadeUpTo: ISODate
    nextDue: ISODate
  }
  confirmationStatement: {
    lastMadeUpTo?: ISODate
    nextMadeUpTo: ISODate
    nextDue: ISODate
  }
  previousNames?: { name: string; from: ISODate; to: ISODate }[]
  hasCharges?: boolean
  filings: DemoFiling[]
  /** Officer details the register shows, keyed by fictional person id. */
  officers: Record<string, { occupation?: string; countryOfResidence: string }>
  resigned?: {
    name: string
    roleLabel: string
    appointedOn: ISODate
    resignedOn: ISODate
    nationality: string
    occupation?: string
  }[]
}

export const registerDetails: Record<string, DemoRegisterDetails> = {
  '99418027': {
    accountingReference: { day: 30, month: 4 },
    accounts: {
      lastMadeUpTo: '2025-04-30',
      lastType: 'Micro-entity',
      nextMadeUpTo: '2026-04-30',
      nextDue: '2027-01-31',
    },
    confirmationStatement: {
      lastMadeUpTo: '2026-04-06',
      nextMadeUpTo: '2027-04-06',
      nextDue: '2027-04-20',
    },
    hasCharges: true,
    filings: [
      {
        date: '2026-04-14',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 6 April 2026 with no updates',
      },
      {
        date: '2026-01-22',
        type: 'AA',
        category: 'Accounts',
        description: 'Micro company accounts made up to 30 April 2025',
      },
      {
        date: '2025-04-11',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 6 April 2025 with no updates',
      },
      {
        date: '2024-09-03',
        type: 'MR01',
        category: 'Mortgage',
        description:
          'Registration of charge 994180270002, created on 28 August 2024',
      },
      {
        date: '2022-04-05',
        type: 'AP01',
        category: 'Officers',
        description:
          'Appointment of Miss Lucy Rose Ashby as a director on 1 April 2022',
      },
    ],
    officers: {
      'p-margaret': {
        occupation: 'Master baker',
        countryOfResidence: 'England',
      },
      'p-lucy': {
        occupation: 'Company director',
        countryOfResidence: 'England',
      },
      'p-thomas': { occupation: 'Baker', countryOfResidence: 'England' },
    },
  },
  '99520316': {
    accountingReference: { day: 30, month: 9 },
    accounts: {
      lastMadeUpTo: '2025-09-30',
      lastType: 'Total exemption full',
      nextMadeUpTo: '2026-09-30',
      nextDue: '2027-06-30',
    },
    confirmationStatement: {
      lastMadeUpTo: '2025-09-30',
      nextMadeUpTo: '2026-09-30',
      nextDue: '2026-10-14',
    },
    previousNames: [
      { name: 'LUMENFIELD LABS LTD', from: '2019-09-17', to: '2021-05-10' },
    ],
    filings: [
      {
        date: '2026-06-18',
        type: 'AA',
        category: 'Accounts',
        description:
          'Total exemption full accounts made up to 30 September 2025',
      },
      {
        date: '2026-02-03',
        type: 'SH01',
        category: 'Capital',
        description:
          'Statement of capital following an allotment of shares on 27 January 2026',
      },
      {
        date: '2025-10-08',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 30 September 2025 with updates',
      },
      {
        date: '2024-02-14',
        type: 'AP01',
        category: 'Officers',
        description:
          'Appointment of Ms Sofia Maria Lindqvist as a director on 12 February 2024',
      },
      {
        date: '2023-03-31',
        type: 'TM01',
        category: 'Officers',
        description:
          'Termination of appointment of Oliver James Brennan as a director on 31 March 2023',
      },
      {
        date: '2021-05-10',
        type: 'NM01',
        category: 'Change of name',
        description:
          'Change of name by resolution: previously LUMENFIELD LABS LTD',
      },
    ],
    officers: {
      'p-priya': {
        occupation: 'Chief executive',
        countryOfResidence: 'England',
      },
      'p-anna': {
        occupation: 'Software engineer',
        countryOfResidence: 'England',
      },
      'p-sofia': {
        occupation: 'Finance director',
        countryOfResidence: 'United Kingdom',
      },
      'p-marcus': {
        occupation: 'Non-executive director',
        countryOfResidence: 'Scotland',
      },
    },
    resigned: [
      {
        name: 'BRENNAN, Oliver James',
        roleLabel: 'Director',
        appointedOn: '2019-09-17',
        resignedOn: '2023-03-31',
        nationality: 'British',
        occupation: 'Software engineer',
      },
    ],
  },
  '99630741': {
    accountingReference: { day: 28, month: 2 },
    accounts: {
      lastMadeUpTo: '2025-02-28',
      lastType: 'Small',
      nextMadeUpTo: '2026-02-28',
      nextDue: '2026-11-30',
    },
    confirmationStatement: {
      lastMadeUpTo: '2026-02-28',
      nextMadeUpTo: '2027-02-28',
      nextDue: '2027-03-14',
    },
    hasCharges: true,
    filings: [
      {
        date: '2026-03-06',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 28 February 2026 with no updates',
      },
      {
        date: '2025-11-19',
        type: 'AA',
        category: 'Accounts',
        description: 'Accounts for a small company made up to 28 February 2025',
      },
      {
        date: '2025-03-04',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 28 February 2025 with no updates',
      },
      {
        date: '2019-02-05',
        type: 'AP01',
        category: 'Officers',
        description:
          'Appointment of Mrs Nadia Kerr as a director on 1 February 2019',
      },
      {
        date: '2016-06-30',
        type: 'PSC01',
        category: 'Persons with significant control',
        description:
          'Notification of Fiona Anne Corrigan as a person with significant control',
      },
    ],
    officers: {
      'p-aidan': {
        occupation: 'Marine engineer',
        countryOfResidence: 'England',
      },
      'p-nadia': {
        occupation: 'Operations manager',
        countryOfResidence: 'England',
      },
      'p-fiona': { countryOfResidence: 'England' },
    },
  },
  '99712058': {
    accountingReference: { day: 31, month: 3 },
    accounts: {
      lastMadeUpTo: '2025-03-31',
      lastType: 'Micro-entity',
      nextMadeUpTo: '2026-03-31',
      nextDue: '2026-12-31',
    },
    confirmationStatement: {
      lastMadeUpTo: '2026-03-01',
      nextMadeUpTo: '2027-03-01',
      nextDue: '2027-03-15',
    },
    filings: [
      {
        date: '2026-03-09',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 1 March 2026 with no updates',
      },
      {
        date: '2025-12-02',
        type: 'AA',
        category: 'Accounts',
        description: 'Micro company accounts made up to 31 March 2025',
      },
      {
        date: '2021-03-01',
        type: 'NEWINC',
        category: 'Incorporation',
        description: 'Incorporation of a private limited company',
      },
    ],
    officers: {
      'p-grace': {
        occupation: 'Garden designer',
        countryOfResidence: 'England',
      },
    },
  },
  '99804613': {
    accountingReference: { day: 30, month: 11 },
    accounts: {
      lastMadeUpTo: '2025-11-30',
      lastType: 'Small',
      nextMadeUpTo: '2026-11-30',
      nextDue: '2027-08-31',
    },
    confirmationStatement: {
      lastMadeUpTo: '2025-11-14',
      nextMadeUpTo: '2026-11-14',
      nextDue: '2026-11-28',
    },
    filings: [
      {
        date: '2026-07-20',
        type: 'AA',
        category: 'Accounts',
        description: 'Accounts for a small company made up to 30 November 2025',
      },
      {
        date: '2025-11-21',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 14 November 2025 with no updates',
      },
      {
        date: '2025-06-02',
        type: 'AD01',
        category: 'Address',
        description:
          'Registered office address changed from 12 Corn Street, Bristol, BS1 1HT to 88 Bridge Street, Bristol, BS1 2PU',
      },
      {
        date: '2016-11-14',
        type: 'NEWINC',
        category: 'Incorporation',
        description: 'Incorporation of a private limited company',
      },
    ],
    officers: {
      'p-imogen': { occupation: 'Architect', countryOfResidence: 'England' },
      'p-samuel': { occupation: 'Architect', countryOfResidence: 'England' },
    },
  },
  '99915372': {
    accountingReference: { day: 31, month: 5 },
    accounts: {
      lastMadeUpTo: '2025-05-31',
      lastType: 'Micro-entity',
      nextMadeUpTo: '2026-05-31',
      nextDue: '2027-02-28',
    },
    confirmationStatement: {
      lastMadeUpTo: '2026-05-21',
      nextMadeUpTo: '2027-05-21',
      nextDue: '2027-06-04',
    },
    filings: [
      {
        date: '2026-05-28',
        type: 'CS01',
        category: 'Confirmation statement',
        description:
          'Confirmation statement made on 21 May 2026 with no updates',
      },
      {
        date: '2026-02-17',
        type: 'AA',
        category: 'Accounts',
        description: 'Micro company accounts made up to 31 May 2025',
      },
      {
        date: '2023-05-22',
        type: 'NEWINC',
        category: 'Incorporation',
        description: 'Incorporation of a private limited company',
      },
    ],
    officers: {
      'p-hannah': { occupation: 'Caterer', countryOfResidence: 'Wales' },
    },
  },
}
