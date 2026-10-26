import type { OnboardingApplication } from '@/types/domain'

/*
  Three applications waiting (two ACSPs and a Referral Partner) for a Platform Administrator. Answers are typed and
  grouped by section, never free-text blobs. Synthetic organisations only.
*/
export function seedApplications(now: number): OnboardingApplication[] {
  const at = (h: number) => new Date(now - h * 3_600_000).toISOString()
  return [
    {
      id: 'APP-ACSP-2026-0102',
      kind: 'acsp',
      name: 'Lindqvist & Moore Legal',
      submittedAt: at(30),
      status: 'pending_approval',
      answers: {
        organisation: {
          legalName: 'Lindqvist & Moore Legal LLP',
          kind: 'Law firm',
          address: '5 Albion Place, Edinburgh EH1 3QB',
          vatNumber: 'GB 276 1190 45',
        },
        regulatoryStatus: {
          acspNumber: 'ACSP-0452-6618',
          supervisor: 'Law Society of Scotland',
          supervisorNumber: 'LSS-48812',
          onCompaniesHouseList: true,
        },
        people: {
          administrator: 'Kirsten Moore',
          administratorMobile: '07700 900931',
          administratorMobileConfirmed: true,
          reviewers: ['Kirsten Moore', 'Fraser Lindqvist'],
          reviewerMobilesConfirmed: true,
          trainedForOption2: true,
        },
        casesAccepted: {
          residenceCountries: ['United Kingdom', 'Ireland', 'Sweden'],
          documentTypes: ['passport', 'driving_licence'],
          languages: ['English', 'Swedish'],
          roles: ['director', 'psc'],
          higherRisk: false,
          perDay: 5,
          perWeek: 20,
          perMonth: 70,
          targetTurnaroundHours: 48,
        },
        commercial: {
          standardFee: 125,
          enhancedFee: 190,
          currency: 'GBP',
          pepAndSanctionsScreening: 'on',
          electronicAddressCheck: 'off',
          paymentProviderStatus: 'Eligible',
          plan: 'Per-case fee on referred cases',
        },
        evidenceAndRetention: {
          retention: 'platform',
          retentionYears: 7,
        },
        declarations: {
          accurate: true,
          acceptsAgencyModel: true,
          acceptsMonitoring: true,
        },
      },
    },
    {
      id: 'APP-ACSP-2026-0103',
      kind: 'acsp',
      name: 'Harrowgate & Imrie Solicitors',
      submittedAt: at(18),
      status: 'pending_approval',
      answers: {
        organisation: {
          legalName: 'Harrowgate & Imrie Solicitors Ltd',
          kind: 'Law firm',
          address: '41 Castle Street, Cardiff CF10 1BS',
          vatNumber: 'GB 301 5527 18',
        },
        regulatoryStatus: {
          acspNumber: 'ACSP-0466-9021',
          supervisor: 'Solicitors Regulation Authority',
          supervisorNumber: 'SRA-662031',
          onCompaniesHouseList: true,
        },
        people: {
          administrator: 'Rhian Imrie',
          administratorMobile: '07700 900447',
          administratorMobileConfirmed: true,
          reviewers: ['Rhian Imrie', 'Owen Harrowgate'],
          reviewerMobilesConfirmed: true,
          trainedForOption2: false,
        },
        casesAccepted: {
          residenceCountries: ['United Kingdom'],
          documentTypes: ['passport', 'driving_licence'],
          languages: ['English', 'Welsh'],
          roles: ['director', 'psc'],
          higherRisk: false,
          perDay: 4,
          perWeek: 16,
          perMonth: 60,
          targetTurnaroundHours: 36,
        },
        commercial: {
          standardFee: 95,
          enhancedFee: 150,
          currency: 'GBP',
          pepAndSanctionsScreening: 'off',
          electronicAddressCheck: 'off',
          paymentProviderStatus: 'More information needed',
          plan: 'Per-case fee on referred cases',
        },
        evidenceAndRetention: {
          retention: 'platform',
          retentionYears: 7,
        },
        declarations: {
          accurate: true,
          acceptsAgencyModel: true,
          acceptsMonitoring: true,
        },
      },
    },
    {
      id: 'APP-RP-2026-0101',
      kind: 'partner',
      name: 'Calder & Finch Business Advisers',
      submittedAt: at(52),
      status: 'pending_approval',
      answers: {
        organisation: {
          legalName: 'Calder & Finch Business Advisers Ltd',
          kind: 'Tax adviser',
          country: 'United Kingdom',
          address: '19 Market Place, Wakefield WF1 1PR',
        },
        regulatoryStatus: {
          regulator: 'Chartered Institute of Taxation',
          membershipNumber: 'CIOT-71204',
          isAlsoAcsp: false,
        },
        people: {
          administrator: 'Naomi Finch',
          administratorMobile: '07700 900942',
          administratorMobileConfirmed: true,
          users: ['Naomi Finch', 'Dale Calder'],
        },
        clientPortfolio: {
          companies: 38,
          directorsAndPscs: 71,
          mainSector: 'Owner-managed businesses',
        },
        workflow: {
          rolesUsed: ['partner_admin', 'referrer', 'portfolio_viewer'],
          payingMethod: 'Client pays, or Agent Payment Code',
        },
        commercial: {
          wishesToReceivePayment: false,
        },
        dataAndAuthority: {
          authorisedByClients: true,
          seesStatusOnly: true,
        },
        declarations: {
          accurate: true,
          notTheVerifyingAcsp: true,
        },
      },
    },
  ]
}
