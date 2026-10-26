/*
  Marketing copy and company details in one place. The client has said the
  marketing wording is a placeholder that she will have professionally
  reviewed, so replace it here rather than in the components.
*/

/** Evidence One Limited's own details: the only real names in the demo. The ICO number is not yet issued. */
export const company = {
  name: 'Evidence One Limited',
  number: '17509214',
  registeredOffice: '1 Giltspur Street, London EC1A 9DD',
  email: 'info@evidenceone.co.uk',
} as const

export const footerCopy = {
  tagline: 'A clearer tomorrow',
  disclaimer:
    'Demonstration prototype. Every person, company and document shown is fictional.',
  notAffiliated: 'Not affiliated with Companies House or GOV.UK.',
  legal: `${company.name}. Registered in England and Wales, company number ${company.number}. Registered office ${company.registeredOffice}.`,
}

/** Hero portrait: the simulated check labels and the picture description. The person shown is fictional (AI-generated). */
export const heroScan = {
  alt: 'A fictional person whose face is being scanned, shown as an illustration of a live identity check.',
  checks: [
    'DOCUMENT AUTHENTIC',
    'LIVENESS PASSED',
    'FACE MATCH 98.6%',
    'PEP AND SANCTIONS CLEAR',
    'REGISTER MATCH',
    'READY FOR ACSP REVIEW',
  ],
}

export const heroCopy = {
  kicker: 'Alongside the free GOV.UK ID Check app',
  titleLines: ['Verify with an ACSP,', 'in your browser.'],
  lead: 'A named, regulated ACSP carries out your identity verification for Companies House. Evidence One is their technology provider.',
  facts: [
    'One document, in your browser',
    'Decided by a named, regulated ACSP',
    'Charged only when your ACSP approves',
  ],
  entries: {
    verify: {
      title: 'Verify my identity',
      hint: 'Choose an ACSP and verify in your browser.',
    },
    govuk: {
      title: 'Had trouble with the GOV.UK app?',
      hint: 'See how an ACSP can help you finish.',
    },
    partners: {
      title: 'For Referral Partners',
      hint: 'Bring your clients and track every case.',
    },
    acsps: {
      title: 'For ACSPs',
      hint: 'Verify, submit and file on one platform.',
    },
  },
}

export const forwardCopy = {
  kicker: 'A simpler way forward',
  title: 'Connecting businesses, ACSPs and Companies House.',
  subtitle: 'Less complexity. More progress.',
}

/** "Two routes, one register": how Evidence One sits alongside the GOV.UK ID Check app. */
export const alongsideCopy = {
  kicker: 'Two routes, one register',
  title: 'Evidence One sits alongside the free GOV.UK ID Check app.',
  lead: 'Both routes end with your identity verified for Companies House. They suit different people, so choose the one that fits you.',
  govuk: {
    label: 'Free, from GOV.UK',
    title: 'The GOV.UK ID Check app',
    body: 'If you have a passport with a chip and a compatible smartphone, you can verify your identity yourself, at no cost, with the free GOV.UK ID Check app. Many people finish in a few minutes.',
  },
  evidenceOne: {
    label: 'With an ACSP you choose',
    title: 'Evidence One, in your browser',
    body: "Your named ACSP carries out the verification using the Evidence One platform, on a laptop or a phone. It suits you if you do not have a compatible phone or a chipped document, if you want guided help with your documents, or if you want help in your own language. The ACSP's fee is shown before you pay.",
    verifyCta: 'Verify my identity',
    govukCta: 'Had trouble with the GOV.UK app?',
  },
  professionals:
    'Professionals who look after several directors and people with significant control use Evidence One to send invites, follow every case in one place and keep an audit trail.',
}

/** "Who does what": the four cards, in order. */
export const modelCopy = {
  kicker: 'Who does what',
  title: 'A named ACSP verifies you. The platform keeps the evidence.',
  cards: [
    {
      title: 'You instruct a named ACSP',
      body: 'Before you pay, you see who will verify you, their fee and their turnaround. You pay the ACSP, and only when it approves your verification. Evidence One collects the payment as the ACSP’s agent.',
    },
    {
      title: 'The ACSP is the service provider',
      body: 'The ACSP carries out the verification, makes the statement to Companies House and stays responsible for it. Evidence One is its technology provider.',
    },
    {
      title: 'The platform prepares, evidences and records',
      body: 'Evidence One does not verify anyone. It prepares the case, records every check and keeps an audit trail for seven years.',
    },
    {
      title: 'AI is advisory. People decide.',
      body: 'AI observations are labelled and advisory only, and AI is never applied to your identity document. Only the ACSP reviewer can approve, request information or decline. Matching and rules are the same every time.',
    },
  ],
}

/** "Verify. Submit. File.", the hub for ACSPs and Referral Partners, and the trust strip. */
export const connectCopy = {
  steps: {
    titleStrong: 'Verify. Submit. File.',
    titleRest: 'One platform.',
    subtitle: 'From verification to Companies House filings',
    cards: {
      verify: {
        label: 'Verify',
        title: 'Verify your client',
        body: 'Identity verification in the browser with one document, and a complete audit trail.',
      },
      submit: {
        label: 'Submit',
        title: 'Submit to Companies House',
        body: 'A prepared submission, handed off to your own GOV.UK One Login, then the Companies House verification reference recorded.',
      },
      file: {
        label: 'File',
        title: 'File for your client',
        body: 'Register corrections and Companies House filings, in the same place. On subscription plans.',
      },
    },
  },
  hub: {
    srTitle:
      'How Evidence One connects ACSPs, Referral Partners and Companies House',
    acsps: {
      kicker: 'For ACSPs',
      title: 'Your clients. Your workflow.',
      items: [
        'Use Evidence One for your own clients',
        'Receive referred and direct clients',
        'Verify, submit and file',
        'Secure audit trail and records',
      ],
      cta: 'Join as an ACSP',
    },
    partners: {
      kicker: 'For Referral Partners',
      title: 'Bring your clients',
      items: [
        'Invite directors and PSCs from the register',
        'Select one of 2 or 3 matched ACSPs, each with its fee',
        'Follow status and check results in one place',
        'You are never presented as the verifying ACSP',
      ],
      cta: 'Join as a Referral Partner',
      portalLink: 'Open the partner portal',
    },
    source: {
      title: 'Clients and Referral Partners',
      body: 'Need Companies House services',
    },
    motto: 'Connects. Coordinates. Complies.',
    nodes: {
      acsps: { title: 'ACSPs', body: 'Provide regulated services' },
      clients: { title: 'Clients', body: 'Individuals and companies' },
      companiesHouse: {
        title: 'Companies House',
        body: 'Verified and compliant filings',
      },
    },
  },
  trust: {
    label: 'Why Evidence One',
    items: {
      secure: 'Secure by design',
      time: 'Save time, one platform',
      regulatory: 'Regulatory alignment',
      professionals: 'Trusted professionals',
      growth: 'Built for growth',
    },
  },
}

/** "One platform, four parts": the section heading, each part's line and the captions under its panel. */
export const platformCopy = {
  title: 'One platform, four parts',
  lead: 'Each part does one job, and every job leaves evidence.',
  navLabel: 'Platform parts',
  namePrefix: 'Evidence One',
  products: {
    verify: {
      name: 'Verify',
      line: 'Identity verification in the browser. One document, a liveness check and a face match, on desktop and mobile.',
    },
    compliance: {
      name: 'Compliance',
      line: 'Review queues, register comparison that flags differences for the reviewer, and Route B correction tasks.',
    },
    intelligence: {
      name: 'Intelligence',
      line: 'Advisory AI that checks documents and flags differences. It cannot approve or decline.',
    },
    file: {
      name: 'File',
      line: 'An audit-ready record for seven years, with a hash-chained trail that shows any tampering.',
    },
  },
  complianceCaption:
    'A difference is flagged, never halted. The reviewer records a decision and a reason, and the prompt to report it to Companies House is logged.',
  intelligenceCaption:
    'AI cannot approve or decline. Only an ACSP reviewer can.',
}

/** "The product": heading above the product stage and the capabilities marquee. */
export const seeItWorkingCopy = {
  kicker: 'The product',
  title: 'Every check, every decision, in front of the reviewer.',
  capabilitiesLabel: 'Capabilities',
  capabilities: [
    'Companies House identity standard',
    'Option 1 certified IDVT',
    'Browser capture, desktop and mobile',
    'Liveness and face match',
    'PEP and sanctions screening',
    'Register comparison',
    'Route B filings',
    'GOV.UK One Login handoff',
    'Seven-year records',
    'Hash-chained audit trail',
  ],
}
