import type { AcspFirm, AgentOrg } from '@/types/domain'

/*
  Fictional organisations. The ACSP firm conducts identity verification; the
  Agents bring clients to the platform. One Agent has ACSP status (can approve,
  decline or refer) and one does not (can only refer).
*/

export const PRIMARY_ACSP_ID = 'acsp-harcourt'
/** The signed-in ACSP reviewer in the demo. */
export const PRIMARY_REVIEWER_ID = 'rev-marsh'

export const acsps: AcspFirm[] = [
  {
    id: PRIMARY_ACSP_ID,
    name: 'Harcourt Lane Solicitors LLP',
    kind: 'Law firm',
    supervisor: 'Solicitors Regulation Authority',
    acspNumber: 'ACSP-0046-2187',
    reviewers: [
      {
        id: 'rev-marsh',
        name: 'Eleanor Marsh',
        role: 'Partner, ACSP reviewer',
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
        role: 'Senior associate, ACSP reviewer',
      },
      {
        id: 'rev-hartley',
        name: 'Philippa Hartley',
        role: 'Senior partner, ACSP reviewer',
        senior: true,
      },
    ],
    b2cAllocationShare: 50,
    b2cAllocatedThisMonth: 9,
    remunerationPerCase: 30,
  },
  {
    id: 'acsp-northbank',
    name: 'Northbank Compliance Ltd',
    kind: 'Trust or company service provider',
    supervisor: 'HM Revenue and Customs',
    acspNumber: 'ACSP-0112-5530',
    reviewers: [
      {
        id: 'rev-basu',
        name: 'Anjali Basu',
        role: 'Compliance manager, ACSP reviewer',
      },
    ],
    b2cAllocationShare: 30,
    b2cAllocatedThisMonth: 7,
    remunerationPerCase: 30,
  },
  {
    id: 'acsp-pellrowe',
    name: 'Pell & Rowe Chartered Accountants',
    kind: 'Accountancy firm',
    supervisor: 'ICAEW',
    acspNumber: 'ACSP-0201-7764',
    reviewers: [
      {
        id: 'rev-dunmore',
        name: 'Callum Dunmore',
        role: 'Director, ACSP reviewer',
      },
    ],
    b2cAllocationShare: 20,
    b2cAllocatedThisMonth: 5,
    remunerationPerCase: 30,
  },
]

export const PRIMARY_AGENT_ID = 'agent-fenwick'

export const agents: AgentOrg[] = [
  {
    id: PRIMARY_AGENT_ID,
    name: 'Fenwick & Shaw Chartered Accountants',
    kind: 'Accountancy firm',
    hasAcspStatus: true,
    contactName: 'Rachel Fenwick',
    paymentCode: 'APC-FS',
  },
  {
    id: 'agent-belgrave',
    name: 'Belgrave Family Office',
    kind: 'Family office',
    hasAcspStatus: false,
    contactName: 'Oliver Grant',
    paymentCode: 'APC-BF',
  },
]
