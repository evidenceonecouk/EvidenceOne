import type { PartnerAnswers } from '@/store/partnerActions'
import type { PartnerRole } from '@/types/domain'

/*
  Typed form for "Join as a Referral Partner". Every answer is a structured
  field by section, never a free-text blob. The seed is a fictional practice so
  a presenter can click through quickly. All details are synthetic.
*/

export interface TeamUser {
  name: string
  email: string
  mobile: string
  role: PartnerRole
  mobileConfirmed: boolean
}

export interface PartnerForm {
  organisation: {
    legalName: string
    tradingName: string
    country: string
    registrationNumber: string
    addressLine1: string
    town: string
    postcode: string
    website: string
    natureOfBusiness: string
    contactName: string
    contactEmail: string
    contactTelephone: string
    contactMobile: string
    contactMobileConfirmed: boolean
  }
  regulatory: {
    regulated: boolean
    regulator: string
    amlSupervised: boolean
    amlBody: string
    amlReference: string
    isAcsp: boolean
    acspReference: string
    acspName: string
    notVerifyingAcspConfirmed: boolean
  }
  portfolio: {
    companiesManaged: number
    peopleToVerify: number
    clientCountries: string[]
    clientLanguages: string[]
    monthlyVolume: string
    invitationMode: string
    apiNeeded: boolean
    whiteLabelled: boolean
  }
  workflow: {
    whoEntersDetails: string
    whoMayCreateReferrals: string[]
    whoMayViewStatus: string[]
    completionNotifications: boolean
    notificationEmail: string
    team: TeamUser[]
  }
  commercial: {
    whoPays: string
    billing: string
    expectedVolume: number
    currency: string
    vatRegistered: boolean
    vatNumber: string
    purchaseOrderRequired: boolean
    purchaseOrderNote: string
    wishesReferralPayment: boolean
    referralRegulator: string
    referralRegulatorOther: string
  }
  dataAuthority: {
    authorityToAct: boolean
    detailsLawfullyHeld: boolean
    individualsInformed: boolean
    icoRegistered: boolean
    icoReference: string
    transfersOutsideUk: boolean
  }
  declarations: {
    accurate: boolean
    authorised: boolean
    rolesUnderstood: boolean
    noCodesShared: boolean
    keepUpToDate: boolean
  }
}

export const SEED_FORM: PartnerForm = {
  organisation: {
    legalName: 'Marlowe Hythe Business Advisers Ltd',
    tradingName: 'Marlowe Hythe',
    country: 'United Kingdom',
    registrationNumber: '99710482',
    addressLine1: '9 Station Approach',
    town: 'Reading',
    postcode: 'RG1 1AX',
    website: 'https://marlowehythe.example',
    natureOfBusiness: 'Accountancy firm',
    contactName: 'Sunita Rao',
    contactEmail: 'sunita.rao@marlowehythe.example',
    contactTelephone: '0118 496 0188',
    contactMobile: '07700 900781',
    contactMobileConfirmed: false,
  },
  regulatory: {
    regulated: true,
    regulator: 'ICAEW',
    amlSupervised: true,
    amlBody: 'ICAEW',
    amlReference: 'ICAEW-AML-0417722',
    isAcsp: false,
    acspReference: '',
    acspName: '',
    notVerifyingAcspConfirmed: false,
  },
  portfolio: {
    companiesManaged: 64,
    peopleToVerify: 150,
    clientCountries: ['United Kingdom', 'Ireland'],
    clientLanguages: ['English'],
    monthlyVolume: '11 to 50',
    invitationMode: 'Individual and bulk',
    apiNeeded: false,
    whiteLabelled: false,
  },
  workflow: {
    whoEntersDetails: 'Partner staff, from the register',
    whoMayCreateReferrals: ['Partner Administrator', 'Referrer'],
    whoMayViewStatus: ['Partner Administrator', 'Referrer', 'Portfolio Viewer'],
    completionNotifications: true,
    notificationEmail: 'sunita.rao@marlowehythe.example',
    team: [
      {
        name: 'Sunita Rao',
        email: 'sunita.rao@marlowehythe.example',
        mobile: '07700 900781',
        role: 'partner_admin',
        mobileConfirmed: false,
      },
      {
        name: 'Callum Beech',
        email: 'callum.beech@marlowehythe.example',
        mobile: '07700 900782',
        role: 'referrer',
        mobileConfirmed: false,
      },
    ],
  },
  commercial: {
    whoPays: 'The client pays the ACSP',
    billing: 'Per case',
    expectedVolume: 20,
    currency: 'GBP',
    vatRegistered: true,
    vatNumber: 'GB 999 1042 77',
    purchaseOrderRequired: false,
    purchaseOrderNote: '',
    wishesReferralPayment: false,
    referralRegulator: '',
    referralRegulatorOther: '',
  },
  dataAuthority: {
    authorityToAct: true,
    detailsLawfullyHeld: true,
    individualsInformed: true,
    icoRegistered: true,
    icoReference: 'ZB999104',
    transfersOutsideUk: false,
  },
  declarations: {
    accurate: false,
    authorised: false,
    rolesUnderstood: false,
    noCodesShared: false,
    keepUpToDate: false,
  },
}

export const emptyForm = (): PartnerForm => ({
  organisation: {
    legalName: '',
    tradingName: '',
    country: 'United Kingdom',
    registrationNumber: '',
    addressLine1: '',
    town: '',
    postcode: '',
    website: '',
    natureOfBusiness: '',
    contactName: '',
    contactEmail: '',
    contactTelephone: '',
    contactMobile: '',
    contactMobileConfirmed: false,
  },
  regulatory: {
    regulated: false,
    regulator: '',
    amlSupervised: false,
    amlBody: '',
    amlReference: '',
    isAcsp: false,
    acspReference: '',
    acspName: '',
    notVerifyingAcspConfirmed: false,
  },
  portfolio: {
    companiesManaged: 0,
    peopleToVerify: 0,
    clientCountries: [],
    clientLanguages: ['English'],
    monthlyVolume: '',
    invitationMode: '',
    apiNeeded: false,
    whiteLabelled: false,
  },
  workflow: {
    whoEntersDetails: '',
    whoMayCreateReferrals: [],
    whoMayViewStatus: [],
    completionNotifications: false,
    notificationEmail: '',
    team: [
      {
        name: '',
        email: '',
        mobile: '',
        role: 'partner_admin',
        mobileConfirmed: false,
      },
    ],
  },
  commercial: {
    whoPays: '',
    billing: '',
    expectedVolume: 0,
    currency: 'GBP',
    vatRegistered: false,
    vatNumber: '',
    purchaseOrderRequired: false,
    purchaseOrderNote: '',
    wishesReferralPayment: false,
    referralRegulator: '',
    referralRegulatorOther: '',
  },
  dataAuthority: {
    authorityToAct: false,
    detailsLawfullyHeld: false,
    individualsInformed: false,
    icoRegistered: false,
    icoReference: '',
    transfersOutsideUk: false,
  },
  declarations: {
    accurate: false,
    authorised: false,
    rolesUnderstood: false,
    noCodesShared: false,
    keepUpToDate: false,
  },
})

export const STEP_TITLES = [
  'Organisation',
  'Regulatory position',
  'Client portfolio',
  'Workflow and team',
  'Commercial',
  'Data and authority',
  'Declarations',
]

/** Required answers per step. Returns the labels of whatever is missing. */
export function missingFor(step: number, f: PartnerForm): string[] {
  const m: string[] = []
  const need = (ok: unknown, label: string) => {
    if (!ok) m.push(label)
  }
  if (step === 0) {
    const o = f.organisation
    need(o.legalName.trim(), 'Legal name')
    need(o.country.trim(), 'Country')
    need(o.addressLine1.trim() && o.town.trim(), 'Address')
    need(o.natureOfBusiness, 'Nature of business')
    need(o.contactName.trim(), 'Main contact')
    need(o.contactEmail.includes('@'), 'Contact email')
    need(o.contactMobile.trim(), 'Contact mobile number')
    need(o.contactMobileConfirmed, 'Confirm the contact mobile number by code')
  }
  if (step === 1) {
    const r = f.regulatory
    if (r.regulated) need(r.regulator.trim(), 'Regulator')
    if (r.amlSupervised) need(r.amlBody.trim(), 'AML supervisory body')
    if (r.isAcsp) need(r.acspReference.trim(), 'ACSP reference')
    need(
      r.notVerifyingAcspConfirmed,
      'Confirm you will not act as the verifying ACSP',
    )
  }
  if (step === 2) {
    const p = f.portfolio
    need(p.clientCountries.length, 'Client countries')
    need(p.monthlyVolume, 'Expected monthly volume')
    need(p.invitationMode, 'Individual or bulk invitations')
  }
  if (step === 3) {
    const w = f.workflow
    need(w.whoEntersDetails, 'Who enters client details')
    need(w.whoMayCreateReferrals.length, 'Who may create referrals')
    need(w.whoMayViewStatus.length, 'Who may view status')
    need(
      w.team.length && w.team.every((u) => u.name.trim() && u.mobile.trim()),
      'Name and mobile number for each user',
    )
    need(
      w.team.every((u) => u.mobileConfirmed),
      'Confirm each user’s mobile number by code',
    )
  }
  if (step === 4) {
    const c = f.commercial
    need(c.whoPays, 'Who pays')
    need(c.billing, 'Per case or monthly billing')
    if (c.vatRegistered) need(c.vatNumber.trim(), 'VAT number')
    if (c.wishesReferralPayment) need(c.referralRegulator, 'Regulator')
  }
  if (step === 5) {
    const d = f.dataAuthority
    need(d.authorityToAct, 'Authority to act for your clients')
    need(d.detailsLawfullyHeld, 'Details held lawfully')
    need(d.individualsInformed, 'Individuals informed')
  }
  if (step === 6)
    need(Object.values(f.declarations).every(Boolean), 'Tick every declaration')
  return m
}

/** Structured, typed answers by section for the application record. */
export function toAnswers(f: PartnerForm): PartnerAnswers {
  const team: Record<string, string | boolean> = {}
  f.workflow.team.forEach((u, i) => {
    const n = i + 1
    team[`user_${n}_name`] = u.name
    team[`user_${n}_email`] = u.email
    team[`user_${n}_mobile`] = u.mobile
    team[`user_${n}_role`] = u.role
    team[`user_${n}_mobile_confirmed`] = u.mobileConfirmed
  })
  const o = f.organisation
  return {
    organisation: { ...o },
    regulatory: { ...f.regulatory },
    portfolio: { ...f.portfolio },
    workflow: {
      whoEntersDetails: f.workflow.whoEntersDetails,
      whoMayCreateReferrals: f.workflow.whoMayCreateReferrals,
      whoMayViewStatus: f.workflow.whoMayViewStatus,
      referralPartnerAccess: 'status_and_check_results_only',
      completionNotifications: f.workflow.completionNotifications,
      notificationEmail: f.workflow.notificationEmail,
      userCount: f.workflow.team.length,
      ...team,
    },
    commercial: { ...f.commercial },
    data_authority: { ...f.dataAuthority },
    declarations: { ...f.declarations },
  }
}
