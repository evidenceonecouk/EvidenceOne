import type { MatchCriteria } from '@/lib/matching'
import type {
  DemoData,
  IdDocumentType,
  Person,
  RegisterRole,
} from '@/types/domain'

/*
  Builds the structured criteria for suggesting ACSPs to a person, from what the
  person has declared. Deterministic: no AI. The suggestion itself is made by
  suggestAcsps in src/lib/matching.ts.
*/

/** Languages a person can choose for working with their ACSP. Matches the ACSP profile wording. */
export const SUGGESTION_LANGUAGES = [
  'English',
  'Russian',
  'Ukrainian',
  'Arabic',
  'Spanish',
  'French',
  'Italian',
  'Chinese',
] as const

export const DOCUMENT_TYPE_LABEL: Record<IdDocumentType, string> = {
  passport: 'Passport',
  driving_licence: 'UK photocard driving licence',
  national_identity_card: 'National identity card',
  biometric_residence_permit: 'Biometric residence permit',
}

/** Country the person currently lives in, from the current address. */
export function currentResidenceCountry(person: Person): string {
  const current =
    person.addressHistory.find((a) => !a.to) ?? person.addressHistory[0]
  return current?.address.country ?? 'United Kingdom'
}

const ADJECTIVE_TO_COUNTRY: Record<string, string> = {
  Ukrainian: 'Ukraine',
  British: 'United Kingdom',
  Irish: 'Ireland',
  German: 'Germany',
  French: 'France',
  Spanish: 'Spain',
  Italian: 'Italy',
  Cypriot: 'Cyprus',
  Emirati: 'United Arab Emirates',
}

/** Issuing country of the document the person is expected to use: the document if known, else nationality. */
export function defaultIssuingCountry(person: Person): string {
  return (
    person.document?.issuingCountry ??
    ADJECTIVE_TO_COUNTRY[person.nationality] ??
    'United Kingdom'
  )
}

export function defaultDocumentType(person: Person): IdDocumentType {
  return person.document?.type ?? 'passport'
}

export interface SuggestionAnswers {
  residenceCountry: string
  documentType: IdDocumentType
  issuingCountry: string
  languages: string[]
}

export function defaultAnswers(person: Person): SuggestionAnswers {
  return {
    residenceCountry: currentResidenceCountry(person),
    documentType: defaultDocumentType(person),
    issuingCountry: defaultIssuingCountry(person),
    languages: ['English'],
  }
}

export function criteriaFrom(
  answers: SuggestionAnswers,
  role: RegisterRole,
): MatchCriteria {
  return {
    residenceCountry: answers.residenceCountry,
    documentType: answers.documentType,
    issuingCountry: answers.issuingCountry,
    role,
    languages: answers.languages.length ? answers.languages : ['English'],
    higherRisk: false,
    needsCapacityToday: false,
  }
}

/** Criteria for a case from the register and the person's own details, before they have answered anything. */
export function defaultCriteria(
  data: DemoData,
  personId: string,
  companyNumber: string,
): MatchCriteria {
  const person = data.people.find((p) => p.id === personId)
  const entry = data.register.find(
    (r) => r.personId === personId && r.companyNumber === companyNumber,
  )
  return criteriaFrom(
    person
      ? defaultAnswers(person)
      : {
          residenceCountry: 'United Kingdom',
          documentType: 'passport',
          issuingCountry: 'United Kingdom',
          languages: ['English'],
        },
    entry?.role ?? 'director',
  )
}
