import type { DocumentListId, EligibleDocument } from '@/types/domain'

/*
  Document eligibility lists (G2-07, client email of 23 October). Three lists:
  Option 1, Option 2 Group A and Option 2 Group B. "Group A" and "Group B" are
  Option 2 classifications only; Option 1 reads "any other document permitted
  under Option 1".

  The lists are data, never hard-coded in components. They are part of every
  rule set version, so a Companies House change needs no redevelopment: a
  Super Administrator proposes it in a draft version, a second approver
  publishes it with an effective date, and it is audited like any other rule
  change.

  expiryAllowanceMonths is 0 throughout. Expired passports are not accepted
  (H1, decided 19 October). The client has asked the identity provider what it
  supports, so the setting that would apply an allowance is off and marked
  "Subject to provider confirmation".
*/

export const DOCUMENT_LISTS: {
  id: DocumentListId
  label: string
  description: string
}[] = [
  {
    id: 'option1',
    label: 'Option 1',
    description:
      'Documents the certified identity provider can read on the web route.',
  },
  {
    id: 'option2_a',
    label: 'Option 2, Group A',
    description:
      'Photographic documents. Two from Group A, or one from Group A and one from Group B.',
  },
  {
    id: 'option2_b',
    label: 'Option 2, Group B',
    description: 'Supporting documents that are not photographic.',
  },
]

export const OPTION_2_LISTS: DocumentListId[] = ['option2_a', 'option2_b']

export const OPTION_1_ANY_OTHER = 'any other document permitted under Option 1'

const d = (
  id: string,
  label: string,
  list: DocumentListId,
  chip: EligibleDocument['chip'],
  tile?: EligibleDocument['tile'],
): EligibleDocument => ({
  id,
  label,
  list,
  chip,
  tile,
  expiryAllowanceMonths: 0,
  enabled: true,
})

export function defaultDocuments(): EligibleDocument[] {
  return [
    // Option 1
    d(
      'o1-passport',
      'Biometric or machine readable passport',
      'option1',
      'sometimes',
      'passport',
    ),
    d('o1-irish-card', 'Irish passport card', 'option1', 'no', 'passport'),
    d(
      'o1-photocard',
      'UK, Channel Islands, Isle of Man or EU photocard driving licence (full or provisional)',
      'option1',
      'no',
      'driving_licence',
    ),
    d(
      'o1-eu-id',
      'Identity card with biometric information from the EU, Norway, Iceland or Liechtenstein',
      'option1',
      'yes',
      'national_identity_card',
    ),
    d(
      'o1-brp',
      'UK biometric residence permit',
      'option1',
      'yes',
      'biometric_residence_permit',
    ),
    d(
      'o1-brc',
      'UK biometric residence card',
      'option1',
      'yes',
      'biometric_residence_permit',
    ),
    d(
      'o1-frontier',
      'UK Frontier Worker permit',
      'option1',
      'yes',
      'biometric_residence_permit',
    ),
    d('o1-evisa', 'eVisa', 'option1', 'no', 'evisa'),
    // Option 2, Group A
    d(
      'a-passport',
      'Passport or Irish passport card',
      'option2_a',
      'sometimes',
    ),
    d(
      'a-eu-id',
      'Identity card with biometric information from the EU, Norway, Iceland or Liechtenstein',
      'option2_a',
      'yes',
    ),
    d('a-brp', 'UK biometric residence permit', 'option2_a', 'yes'),
    d('a-brc', 'UK biometric residence card', 'option2_a', 'yes'),
    d('a-pass', 'UK accredited PASS card', 'option2_a', 'no'),
    d(
      'a-tachograph',
      'UK or EU driver digital tachograph card',
      'option2_a',
      'no',
    ),
    d(
      'a-photocard',
      'UK, Channel Islands, Isle of Man or EU photocard driving licence',
      'option2_a',
      'no',
    ),
    d('a-forces-id', 'UK HM Forces ID card', 'option2_a', 'no'),
    d('a-veteran', 'UK HM Armed Forces Veteran card', 'option2_a', 'no'),
    d('a-frontier', 'UK Frontier Worker permit', 'option2_a', 'yes'),
    d('a-work-permit', 'Photographic work permit', 'option2_a', 'no'),
    d('a-imm-doc', 'Photographic immigration document', 'option2_a', 'no'),
    d('a-visa', 'Photographic visa', 'option2_a', 'no'),
    d(
      'a-firearms',
      'UK, Channel Islands or Isle of Man firearms licence',
      'option2_a',
      'no',
    ),
    d(
      'a-prado',
      'Another photographic ID listed on PRADO',
      'option2_a',
      'sometimes',
    ),
    // Option 2, Group B
    d('b-birth', 'Birth or adoption certificate', 'option2_b', 'no'),
    d(
      'b-marriage',
      'Marriage or civil partnership certificate',
      'option2_b',
      'no',
    ),
    d(
      'b-imm-nonphoto',
      'Non-photographic immigration document, visa or work permit',
      'option2_b',
      'no',
    ),
    d('b-bank', 'Bank or building society statement', 'option2_b', 'no'),
    d(
      'b-rental',
      'UK local authority or social housing rental agreement (current address)',
      'option2_b',
      'no',
    ),
    d('b-mortgage', 'Mortgage statement (current address)', 'option2_b', 'no'),
    d(
      'b-council-tax',
      'UK council tax statement (current address)',
      'option2_b',
      'no',
    ),
    d('b-utility', 'Utility bill (current address)', 'option2_b', 'no'),
    d('b-insurance', 'Insurance policy (current address)', 'option2_b', 'no'),
  ]
}

export const CHIP_LABEL: Record<EligibleDocument['chip'], string> = {
  yes: 'Chip expected',
  no: 'No chip',
  sometimes: 'Chip on some',
}

/** The documents on one list that are switched on in a rule set. */
export const documentsOn = (
  documents: EligibleDocument[],
  list: DocumentListId,
) => documents.filter((x) => x.list === list && x.enabled)

/** Identity types the person can pick on the document step, with the Option 1 documents behind each. */
export const TILE_TYPES = [
  'passport',
  'driving_licence',
  'national_identity_card',
  'biometric_residence_permit',
] as const

/** True when at least one switched-on Option 1 document sits behind the tile. */
export const option1Offers = (
  documents: EligibleDocument[],
  tile: EligibleDocument['tile'],
) => documentsOn(documents, 'option1').some((x) => x.tile === tile)

/** The Option 1 documents behind a tile, for the note shown to the individual. */
export const option1Behind = (
  documents: EligibleDocument[],
  tile: EligibleDocument['tile'],
) =>
  documentsOn(documents, 'option1')
    .filter((x) => x.tile === tile)
    .map((x) => x.label)
