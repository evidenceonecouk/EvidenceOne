import type { Company, RegisterEntry } from '@/types/domain'

/*
  Fictional companies. Numbers use the 99xxxxxx range, which Companies House
  has not allocated, so they cannot collide with a real company. They also
  serve as the mock fallback when the live register search is unavailable.
*/

export const companies: Company[] = [
  {
    number: '99418027',
    name: 'ASHBY & DAUGHTERS BAKERY LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2011-04-06',
    registeredOffice: { line1: '4 Mill Lane', town: 'Ludlow', postcode: 'SY8 1EQ', country: 'United Kingdom' },
    sicCodes: ['10710'],
    sicDescription: 'Manufacture of bread; fresh pastry goods and cakes',
    lodgedByAgentId: 'agent-fenwick',
    connectedAt: '2026-08-12T09:20:00.000Z',
  },
  {
    number: '99520316',
    name: 'LUMENFIELD TECHNOLOGIES LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2019-09-17',
    registeredOffice: { line1: 'Unit 3, Canal Wharf', town: 'Leeds', postcode: 'LS11 5PS', country: 'United Kingdom' },
    sicCodes: ['62012'],
    sicDescription: 'Business and domestic software development',
    lodgedByAgentId: 'agent-fenwick',
    connectedAt: '2026-08-12T09:24:00.000Z',
  },
  {
    number: '99630741',
    name: 'CORRIGAN MARINE SERVICES LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2008-02-29',
    registeredOffice: { line1: '2 Quay Street', town: 'Falmouth', postcode: 'TR11 3HH', country: 'United Kingdom' },
    sicCodes: ['33150'],
    sicDescription: 'Repair and maintenance of ships and boats',
    lodgedByAgentId: 'agent-belgrave',
    connectedAt: '2026-09-02T14:05:00.000Z',
  },
  {
    number: '99712058',
    name: 'WHITAKER GARDEN DESIGN LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2021-03-01',
    registeredOffice: { line1: '17 Orchard Row', town: 'Harrogate', postcode: 'HG1 2RT', country: 'United Kingdom' },
    sicCodes: ['71111'],
    sicDescription: 'Architectural activities',
  },
  {
    number: '99804613',
    name: 'HOLLOWAY & REID ARCHITECTS LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2016-11-14',
    registeredOffice: { line1: '88 Bridge Street', town: 'Bristol', postcode: 'BS1 2PU', country: 'United Kingdom' },
    sicCodes: ['71111'],
    sicDescription: 'Architectural activities',
  },
  {
    number: '99915372',
    name: 'KESTREL BAY CATERING LTD',
    type: 'ltd',
    status: 'active',
    incorporatedOn: '2023-05-22',
    registeredOffice: { line1: '3 Harbour Parade', town: 'Whitby', postcode: 'YO21 3PR', country: 'United Kingdom' },
    sicCodes: ['56210'],
    sicDescription: 'Event catering activities',
  },
]

export const register: RegisterEntry[] = [
  // Ashby & Daughters Bakery: small family company
  { personId: 'p-margaret', companyNumber: '99418027', role: 'director_psc', appointedOn: '2011-04-06', registerName: 'ASHBY, Margaret Ellen', registerNationality: 'British', registerDobMonthYear: 'May 1961', natureOfControl: 'Ownership of shares: 75% or more' },
  { personId: 'p-lucy', companyNumber: '99418027', role: 'director', appointedOn: '2022-04-01', registerName: 'ASHBY, Lucy Rose', registerNationality: 'British', registerDobMonthYear: 'January 1993' },
  { personId: 'p-thomas', companyNumber: '99418027', role: 'director', appointedOn: '2018-01-15', registerName: 'ASHBY, Thomas James', registerNationality: 'British', registerDobMonthYear: 'August 1989' },

  // Lumenfield Technologies: growing tech company
  { personId: 'p-priya', companyNumber: '99520316', role: 'director_psc', appointedOn: '2019-09-17', registerName: 'RAMAN, Priya Lakshmi', registerNationality: 'British', registerDobMonthYear: 'February 1987', natureOfControl: 'Ownership of shares: more than 50% but less than 75%' },
  { personId: 'p-daniel', companyNumber: '99520316', role: 'director', appointedOn: '2021-06-01', registerName: 'OKAFOR, Daniel Chukwuemeka', registerNationality: 'British', registerDobMonthYear: 'November 1990' },
  { personId: 'p-sofia', companyNumber: '99520316', role: 'director', appointedOn: '2024-02-12', registerName: 'LINDQVIST, Sofia Maria', registerNationality: 'Swedish', registerDobMonthYear: 'July 1985' },
  { personId: 'p-marcus', companyNumber: '99520316', role: 'director', appointedOn: '2022-10-03', registerName: 'HALE, Marcus Edward', registerNationality: 'British', registerDobMonthYear: 'January 1976' },

  // Corrigan Marine Services: register mismatch story
  { personId: 'p-aidan', companyNumber: '99630741', role: 'director', appointedOn: '2008-02-29', registerName: 'CORRIGAN, Aiden Patrick', registerNationality: 'Irish', registerDobMonthYear: 'March 1979' },
  { personId: 'p-nadia', companyNumber: '99630741', role: 'director', appointedOn: '2019-02-01', registerName: 'KERR, Nadia', registerNationality: 'British', registerDobMonthYear: 'December 1984' },
  { personId: 'p-fiona', companyNumber: '99630741', role: 'psc', appointedOn: '2015-07-01', registerName: 'CORRIGAN, Fiona Anne', registerNationality: 'British', registerDobMonthYear: 'September 1981', natureOfControl: 'Ownership of shares: more than 25% but not more than 50%' },

  // Whitaker Garden Design: B2C client
  { personId: 'p-grace', companyNumber: '99712058', role: 'director_psc', appointedOn: '2021-03-01', registerName: 'WHITAKER, Grace Elizabeth', activeAppointments: 3, registerNationality: 'British', registerDobMonthYear: 'June 1972', natureOfControl: 'Ownership of shares: 75% or more' },

  // Holloway & Reid: not yet connected, used in the lookup and connect step
  { personId: 'p-imogen', companyNumber: '99804613', role: 'director_psc', appointedOn: '2016-11-14', registerName: 'REID, Imogen Clare', registerNationality: 'British', registerDobMonthYear: 'April 1983', natureOfControl: 'Ownership of shares: more than 25% but not more than 50%' },
  { personId: 'p-samuel', companyNumber: '99804613', role: 'director', appointedOn: '2016-11-14', registerName: 'HOLLOWAY, Samuel Peter', registerNationality: 'British', registerDobMonthYear: 'December 1980', identityVerified: true },

  // Kestrel Bay Catering: a member of the public who comes to Evidence One directly
  { personId: 'p-hannah', companyNumber: '99915372', role: 'director_psc', appointedOn: '2023-05-22', registerName: 'PRYCE, Hannah Louise', registerNationality: 'British', registerDobMonthYear: 'October 1988', natureOfControl: 'Ownership of shares: 75% or more' },
]
