import { withGates } from '@/lib/payments'
import type {
  AcspFirm,
  AcspMonitoring,
  AcspProfile,
  ReferralPartner,
} from '@/types/domain'
import { seedPlan } from './packages'

/*
  Fictional organisations. ACSPs perform the verification; Referral Partners
  bring clients and never decide. ACSP and Referral Partner are separate
  organisation types: a firm that is both is onboarded twice and acts through
  one at a time (Fenwick & Shaw below).

  Dates are fixed rather than relative: the monitoring page shows them as data.
*/

export const PRIMARY_ACSP_ID = 'acsp-harcourt'
/** The signed-in ACSP reviewer in the demo. */
export const PRIMARY_REVIEWER_ID = 'rev-marsh'

const monitoring = (m: Partial<AcspMonitoring> = {}): AcspMonitoring => ({
  lastCheckAt: '2026-10-05T07:30:00.000Z',
  lastSource: 'opt_in_list',
  lastReconfirmedAt: '2026-03-10T10:00:00.000Z',
  nextReconfirmationDue: '2027-03-10T10:00:00.000Z',
  nameMatchConfirmedBy: 'Marcus Adeyemi, Platform Administrator',
  ...m,
})

const profile = (
  p: Partial<AcspProfile> & Pick<AcspProfile, 'address' | 'connectedAccount'>,
): AcspProfile => ({
  residenceCountries: ['United Kingdom'],
  excludedJurisdictions: [],
  documentTypes: ['passport', 'driving_licence'],
  issuingCountries: ['United Kingdom'],
  acceptsNonBiometricDocuments: false,
  languages: ['English'],
  roles: ['director', 'psc', 'director_psc'],
  acceptsProposedDirectors: false,
  acceptsHigherRisk: false,
  capacity: { perDay: 10, perWeek: 40, perMonth: 150 },
  usedToday: 3,
  acceptingNewCases: true,
  targetTurnaroundHours: 48,
  fee: { standard: 49, enhanced: 95, currency: 'GBP' },
  evidenceRetention: 'platform',
  pepScreening: true,
  addressCheck: false,
  ...p,
})

export const acsps: AcspFirm[] = [
  // Law firm accepting overseas clients, with Russian and Ukrainian support and a 24-hour turnaround.
  {
    id: PRIMARY_ACSP_ID,
    name: 'Harcourt Lane Solicitors LLP',
    kind: 'Law firm',
    supervisor: 'Solicitors Regulation Authority',
    supervisorNumber: 'SRA-653210',
    acspNumber: 'ACSP-0046-2187',
    status: 'active',
    approval: 'approved',
    payments: withGates({
      providerStatus: 'eligible',
      evidenceOneApproved: true,
    }),
    reviewers: [
      {
        id: 'rev-marsh',
        name: 'Eleanor Marsh',
        role: 'Partner, ACSP Reviewer and ACSP Administrator',
        roles: ['acsp_admin', 'acsp_reviewer'],
        mobile: '07700 900611',
        mobileConfirmed: true,
        attestation: {
          course: 'Person checks under Option 2',
          completedOn: '2026-07-14',
          expiresOn: '2027-07-13',
          reference: 'TA-2026-0187',
        },
      },
      {
        id: 'rev-okoro',
        name: 'James Okoro',
        role: 'Senior associate, ACSP Reviewer',
        roles: ['acsp_reviewer'],
        mobile: '07700 900612',
        mobileConfirmed: true,
      },
      {
        id: 'rev-hartley',
        name: 'Philippa Hartley',
        role: 'Senior partner, ACSP Reviewer',
        roles: ['acsp_reviewer'],
        mobile: '07700 900613',
        mobileConfirmed: true,
        senior: true,
      },
    ],
    profile: profile({
      address: '14 Harcourt Lane, London EC4A 2QR',
      connectedAccount: 'acct_HL_synthetic_4471',
      vatNumber: 'GB 301 4471 82',
      addressCheck: true,
      residenceCountries: [
        'United Kingdom',
        'United Arab Emirates',
        'Ireland',
        'Germany',
        'Cyprus',
      ],
      excludedJurisdictions: ['Iran', 'North Korea', 'Syria'],
      documentTypes: [
        'passport',
        'driving_licence',
        'national_identity_card',
        'biometric_residence_permit',
      ],
      issuingCountries: ['Any'],
      acceptsNonBiometricDocuments: true,
      languages: ['English', 'Russian', 'Ukrainian'],
      acceptsProposedDirectors: true,
      acceptsHigherRisk: true,
      capacity: { perDay: 12, perWeek: 50, perMonth: 200 },
      usedToday: 5,
      targetTurnaroundHours: 24,
      fee: { standard: 150, enhanced: 220, currency: 'GBP' },
    }),
    monitoring: monitoring(),
    plan: seedPlan(PRIMARY_ACSP_ID, 'monthly'),
    b2cAllocationShare: 50,
    b2cAllocatedThisMonth: 9,
  },

  // UK-only, English-speaking sole practitioner.
  {
    id: 'acsp-pellrowe',
    name: 'Alison Pell, Chartered Accountant',
    kind: 'Sole practitioner',
    supervisor: 'ICAEW',
    supervisorNumber: 'ICAEW-M-0720419',
    acspNumber: 'ACSP-0201-7764',
    status: 'active',
    approval: 'approved',
    payments: withGates({
      providerStatus: 'eligible',
      evidenceOneApproved: true,
    }),
    reviewers: [
      {
        id: 'rev-pell',
        name: 'Alison Pell',
        role: 'Sole practitioner, ACSP Reviewer and ACSP Administrator',
        roles: ['acsp_admin', 'acsp_reviewer'],
        mobile: '07700 900621',
        mobileConfirmed: true,
      },
    ],
    profile: profile({
      address: '3 Chapel Row, Bath BA1 1HN',
      connectedAccount: 'acct_AP_synthetic_9902',
      vatNumber: 'GB 218 9902 14',
      targetTurnaroundHours: 48,
      capacity: { perDay: 4, perWeek: 15, perMonth: 55 },
      usedToday: 1,
      fee: { standard: 120, enhanced: 180, currency: 'GBP' },
    }),
    monitoring: monitoring(),
    plan: seedPlan('acsp-pellrowe', 'per_case'),
    b2cAllocationShare: 20,
    b2cAllocatedThisMonth: 5,
  },

  // Status has lapsed: on the Companies House ceased and suspended list.
  {
    id: 'acsp-northbank',
    name: 'Northbank Compliance Ltd',
    kind: 'Trust or company service provider',
    supervisor: 'HM Revenue and Customs',
    supervisorNumber: 'XFML00000118842',
    acspNumber: 'ACSP-0112-5530',
    status: 'suspended',
    statusNote:
      'Appears on the Companies House ceased and suspended list published on 1 October 2026. Name match confirmed by an administrator on 5 October 2026.',
    approval: 'approved',
    payments: withGates({
      providerStatus: 'eligible',
      evidenceOneApproved: true,
    }),
    reviewers: [
      {
        id: 'rev-basu',
        name: 'Anjali Basu',
        role: 'Compliance manager, ACSP Reviewer and ACSP Administrator',
        roles: ['acsp_admin', 'acsp_reviewer'],
        mobile: '07700 900631',
        mobileConfirmed: true,
      },
    ],
    profile: profile({
      address: '40 Quayside, Newcastle upon Tyne NE1 3DX',
      connectedAccount: 'acct_NB_synthetic_3318',
      vatNumber: 'GB 190 3318 07',
      residenceCountries: ['United Kingdom', 'Ireland'],
      capacity: { perDay: 6, perWeek: 25, perMonth: 90 },
      usedToday: 0,
      acceptingNewCases: false,
      targetTurnaroundHours: 72,
      fee: { standard: 110, enhanced: 160, currency: 'GBP' },
    }),
    monitoring: monitoring({
      lastCheckAt: '2026-10-05T07:30:00.000Z',
      lastSource: 'ceased_suspended_list',
      lastReconfirmedAt: '2025-08-20T10:00:00.000Z',
      nextReconfirmationDue: '2026-08-20T10:00:00.000Z',
    }),
    plan: seedPlan('acsp-northbank', 'per_case'),
    b2cAllocationShare: 0,
    b2cAllocatedThisMonth: 7,
  },

  // Registered with the platform but not yet on the Companies House opt-in list. Not blocked.
  {
    id: 'acsp-ashdown',
    name: 'Ashdown Trust Services Ltd',
    kind: 'Trust or company service provider',
    supervisor: 'HM Revenue and Customs',
    supervisorNumber: 'XFML00000204419',
    acspNumber: 'ACSP-0318-4096',
    status: 'not_yet_listed',
    statusNote:
      'Not found on the Companies House published list of ACSPs. Time to register: 3 months. Can become Active when the listing arrives.',
    approval: 'approved',
    payments: withGates({
      providerStatus: 'eligible',
      evidenceOneApproved: true,
    }),
    reviewers: [
      {
        id: 'rev-ashdown',
        name: 'Tomasz Wren',
        role: 'Director, ACSP Reviewer and ACSP Administrator',
        roles: ['acsp_admin', 'acsp_reviewer'],
        mobile: '07700 900641',
        mobileConfirmed: true,
      },
    ],
    profile: profile({
      address: '8 Lime Street, Leicester LE1 5GH',
      connectedAccount: 'acct_AT_synthetic_7750',
      vatNumber: 'GB 355 7750 21',
      languages: ['English', 'Italian'],
      capacity: { perDay: 6, perWeek: 25, perMonth: 90 },
      usedToday: 2,
      fee: { standard: 135, enhanced: 190, currency: 'GBP' },
    }),
    monitoring: monitoring({
      lastCheckAt: '2026-10-05T07:30:00.000Z',
      lastReconfirmedAt: '2026-09-18T10:00:00.000Z',
      nextReconfirmationDue: '2027-09-18T10:00:00.000Z',
      nameMatchConfirmedBy: undefined,
      notYetListedSince: '2026-09-18T10:00:00.000Z',
    }),
    plan: seedPlan('acsp-ashdown', 'monthly'),
    b2cAllocationShare: 0,
    b2cAllocatedThisMonth: 0,
  },

  // Fenwick & Shaw as an ACSP. The same firm is a Referral Partner, onboarded separately.
  {
    id: 'acsp-fenwick',
    name: 'Fenwick & Shaw Chartered Accountants',
    kind: 'Accountancy firm',
    supervisor: 'ICAEW',
    supervisorNumber: 'ICAEW-F-0450127',
    acspNumber: 'ACSP-0377-1205',
    status: 'active',
    approval: 'approved',
    payments: withGates({
      providerStatus: 'eligible',
      evidenceOneApproved: true,
    }),
    alsoPartnerId: 'partner-fenwick',
    reviewers: [
      {
        id: 'rev-shaw',
        name: 'Daniel Shaw',
        role: 'Partner, ACSP Reviewer',
        roles: ['acsp_reviewer'],
        mobile: '07700 900651',
        mobileConfirmed: true,
      },
    ],
    profile: profile({
      address: '22 Castle Gate, Nottingham NG1 7AW',
      connectedAccount: 'acct_FS_synthetic_5063',
      vatNumber: 'GB 412 5063 90',
      addressCheck: true,
      capacity: { perDay: 5, perWeek: 20, perMonth: 70 },
      usedToday: 2,
      // Own clients only: not open to referred or B2C cases, so the £69 platform fee never applies to its fee.
      acceptingNewCases: false,
      fee: { standard: 49, enhanced: 90, currency: 'GBP' },
    }),
    monitoring: monitoring(),
    plan: seedPlan('acsp-fenwick', 'per_case'),
    b2cAllocationShare: 0,
    b2cAllocatedThisMonth: 0,
  },
]

export const PRIMARY_PARTNER_ID = 'partner-fenwick'
/** Overseas corporate service provider in Dubai. Sees status only (P11, decided 19 October). */
export const DUBAI_PARTNER_ID = 'partner-meridian'

export const partners: ReferralPartner[] = [
  {
    id: PRIMARY_PARTNER_ID,
    name: 'Fenwick & Shaw Chartered Accountants',
    kind: 'Accountancy firm',
    country: 'United Kingdom',
    alsoAcspId: 'acsp-fenwick',
    contactName: 'Rachel Fenwick',
    contactMobile: '07700 900661',
    paymentCode: 'APC-FS',
    approval: 'approved',
    referralPayment: { wishes: false },
    users: [
      {
        id: 'pu-fenwick-1',
        name: 'Rachel Fenwick',
        role: 'partner_admin',
        email: 'rachel.fenwick@fenwickshaw.example',
        mobile: '07700 900661',
        mobileConfirmed: true,
      },
      {
        id: 'pu-fenwick-2',
        name: 'Tariq Mahmood',
        role: 'referrer',
        email: 'tariq.mahmood@fenwickshaw.example',
        mobile: '07700 900662',
        mobileConfirmed: true,
      },
      {
        id: 'pu-fenwick-3',
        name: 'Beth Lowry',
        role: 'portfolio_viewer',
        email: 'beth.lowry@fenwickshaw.example',
        mobile: '07700 900663',
        mobileConfirmed: true,
      },
    ],
  },
  {
    id: DUBAI_PARTNER_ID,
    name: 'Meridian Gulf Corporate Services',
    kind: 'Corporate service provider',
    country: 'United Arab Emirates',
    contactName: 'Oliver Grant',
    contactMobile: '+971 50 000 0171',
    paymentCode: 'APC-MG',
    approval: 'approved',
    referralPayment: { wishes: false },
    users: [
      {
        id: 'pu-meridian-1',
        name: 'Oliver Grant',
        role: 'partner_admin',
        email: 'oliver.grant@meridiangulf.example',
        mobile: '+971 50 000 0171',
        mobileConfirmed: true,
      },
      {
        id: 'pu-meridian-2',
        name: 'Layla Haddad',
        role: 'referrer',
        email: 'layla.haddad@meridiangulf.example',
        mobile: '+971 50 000 0172',
        mobileConfirmed: true,
      },
    ],
  },
]
