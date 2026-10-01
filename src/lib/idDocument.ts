import { portraitFor } from '@/data/portraits'
import type { IdDocumentType, Person } from '@/types/domain'

/*
  What is printed on the specimen document shown in the app's capture screens.
  Built from the fictional person's seed data; when they choose a document type
  they have no seed record for, the details are synthesised from their profile.
*/
export interface DocumentFacts {
  type: IdDocumentType
  title: string
  issuingCountry: string
  issuingCode: string
  surname: string
  givenNames: string
  nationality: string
  nationalityCode: string
  dob: string
  issued: string
  expiry: string
  number: string
  sex: 'F' | 'M'
  address?: string
}

const titles: Record<IdDocumentType, string> = {
  passport: 'Passport',
  driving_licence: 'Driving licence',
  national_identity_card: 'Identity card',
  biometric_residence_permit: 'Residence permit',
}

const countryCodes: Record<string, string> = {
  'United Kingdom': 'GBR',
  Ireland: 'IRL',
  Sweden: 'SWE',
  Ukraine: 'UKR',
}
const nationalityCodes: Record<string, string> = {
  British: 'GBR',
  Irish: 'IRL',
  Swedish: 'SWE',
  Ukrainian: 'UKR',
}
const homeCountry: Record<string, string> = {
  British: 'United Kingdom',
  Irish: 'Ireland',
  Swedish: 'Sweden',
  Ukrainian: 'Ukraine',
}

function hash(s: string) {
  let h = 7
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const addYears = (iso: string, years: number) =>
  `${Number(iso.slice(0, 4)) + years}${iso.slice(4)}`

/** UK driving licence number: surname, birth date (month + 50 for women), initials, then check characters. */
function licenceNumber(
  surname: string,
  given: string,
  dob: string,
  sex: 'F' | 'M',
  seed: number,
) {
  const s = (surname.replace(/[^A-Z]/g, '') + '99999').slice(0, 5)
  const month = String(
    Number(dob.slice(5, 7)) + (sex === 'F' ? 50 : 0),
  ).padStart(2, '0')
  const initials = (
    given
      .split(' ')
      .map((w) => w[0])
      .join('') + '99'
  ).slice(0, 2)
  const tail = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  return `${s}${dob[2]}${month}${dob.slice(8, 10)}${dob[3]}${initials}9${seed % 10}${tail[seed % tail.length]}`
}

export function documentFacts(
  person: Person,
  type: IdDocumentType,
): DocumentFacts {
  const look = portraitFor(person)
  const seed = hash(person.id + type)
  const doc = person.document?.type === type ? person.document : undefined
  const fullName =
    doc?.nameOnDocument ??
    `${person.givenNames} ${person.familyName}`.toUpperCase()
  const family = person.familyName.toUpperCase()
  const surname = fullName.endsWith(family)
    ? family
    : fullName.split(' ').slice(-1)[0]
  const givenNames = fullName.slice(0, fullName.length - surname.length).trim()
  const nationalityName = doc?.nationalityOnDocument ?? person.nationality
  const issuingCountry =
    doc?.issuingCountry ?? homeCountry[person.nationality] ?? 'United Kingdom'
  const dob = doc?.dobOnDocument ?? person.dateOfBirth
  const expiry =
    doc?.expiresOn ??
    `${2029 + (seed % 5)}-${String(1 + (seed % 12)).padStart(2, '0')}-${String(1 + (seed % 27)).padStart(2, '0')}`
  const number =
    doc?.number ??
    (type === 'driving_licence'
      ? licenceNumber(surname, givenNames, dob, look.sex, seed)
      : type === 'passport'
        ? String(500000000 + (seed % 99999999))
        : `${type === 'biometric_residence_permit' ? 'RA' : 'ID'}${String(seed % 9999999).padStart(7, '0')}`)
  return {
    type,
    title: titles[type],
    issuingCountry,
    issuingCode:
      countryCodes[issuingCountry] ?? issuingCountry.slice(0, 3).toUpperCase(),
    surname,
    givenNames,
    nationality:
      nationalityName === 'British' && type === 'passport'
        ? 'BRITISH CITIZEN'
        : nationalityName.toUpperCase(),
    nationalityCode:
      nationalityCodes[nationalityName] ??
      nationalityName.slice(0, 3).toUpperCase(),
    dob,
    issued: addYears(expiry, type === 'biometric_residence_permit' ? -5 : -10),
    expiry,
    number,
    sex: look.sex,
    address: doc?.addressOnDocument,
  }
}

/** Where the machine-readable zone sits, as a fraction of each specimen document's height (see IdDocumentMockup). */
export const PASSPORT_MRZ_ZONE = { top: 280 / 352, bottom: 348 / 352 }
export const CARD_MRZ_ZONE = { top: 172 / 270, bottom: 264 / 270 }

const months = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

/** Dates as printed on travel documents: 26 NOV 1990. */
export const printedDate = (iso: string) =>
  `${iso.slice(8, 10)} ${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

/** Dates as printed on photocard licences: 26.11.1990. */
export const dottedDate = (iso: string) =>
  `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

/* Machine-readable zone (ICAO Doc 9303), with real check digits over fictional data. */
const charValue = (c: string) =>
  c === '<' ? 0 : c >= '0' && c <= '9' ? Number(c) : c.charCodeAt(0) - 55
export const checkDigit = (s: string) =>
  String(
    [...s].reduce((sum, c, i) => sum + charValue(c) * [7, 3, 1][i % 3], 0) % 10,
  )
const mrzText = (s: string) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]+/g, '<')
const fill = (s: string, n: number) => (s + '<'.repeat(n)).slice(0, n)
const yymmdd = (iso: string) =>
  iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10)

/** Two 44-character lines, as on a passport photo page (TD3). */
export function passportMrz(f: DocumentFacts): [string, string] {
  const line1 = fill(
    `P<${f.issuingCode}${mrzText(f.surname)}<<${mrzText(f.givenNames)}`,
    44,
  )
  const num = fill(mrzText(f.number), 9)
  const dob = yymmdd(f.dob)
  const exp = yymmdd(f.expiry)
  const personal = '<'.repeat(14)
  const a = num + checkDigit(num)
  const b = dob + checkDigit(dob)
  const c = exp + checkDigit(exp)
  const d = personal + checkDigit(personal)
  return [
    line1,
    `${a}${f.nationalityCode}${b}${f.sex}${c}${d}${checkDigit(a + b + c + d)}`,
  ]
}

/** Three 30-character lines, as on the back of an identity card or residence permit (TD1). */
export function cardMrz(f: DocumentFacts): [string, string, string] {
  const code = f.type === 'biometric_residence_permit' ? 'IR' : 'ID'
  const num = fill(mrzText(f.number), 9)
  const line1 = fill(`${code}${f.issuingCode}${num}${checkDigit(num)}`, 30)
  const dob = yymmdd(f.dob)
  const exp = yymmdd(f.expiry)
  const head = `${dob}${checkDigit(dob)}${f.sex}${exp}${checkDigit(exp)}${f.nationalityCode}`
  const line2 = fill(head, 29)
  const composite =
    line1.slice(5, 30) +
    line2.slice(0, 7) +
    line2.slice(8, 15) +
    line2.slice(18, 29)
  return [
    line1,
    line2 + checkDigit(composite),
    fill(`${mrzText(f.surname)}<<${mrzText(f.givenNames)}`, 30),
  ]
}
