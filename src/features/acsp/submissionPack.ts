import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { documentName } from '@/lib/rules'
import { syntheticCode } from '@/store/actions'
import type { AcspFirm, Person, VerificationCase } from '@/types/domain'

export interface PackField {
  key: string
  group: string
  label: string
  value: string
}

/**
  Every item of the verification statement, in the order the Companies House
  service asks for it. The personal code is not part of it: Companies House
  emails that directly to the individual.
*/
export function submissionPack(
  vc: VerificationCase,
  person: Person,
  acsp: AcspFirm,
): PackField[] {
  const fields: PackField[] = [
    {
      key: 'name',
      group: 'The individual',
      label: 'Full name',
      value: fullName(person),
    },
    {
      key: 'former',
      group: 'The individual',
      label: 'Former names',
      value:
        (vc.journey?.formerNames ?? person.formerNames ?? []).join(', ') ||
        'None',
    },
    {
      key: 'dob',
      group: 'The individual',
      label: 'Date of birth',
      value: formatDate(person.dateOfBirth),
    },
    {
      key: 'email',
      group: 'The individual',
      label: 'Email for the personal code',
      value: person.email,
    },
  ]
  const docs =
    vc.option === 2 && vc.option2?.documents
      ? vc.option2.documents.map((d, i) => ({
          type: d.label,
          number: `${d.label.includes('passport') ? 'AA' : 'DL'}${syntheticCode(`${vc.id}-${i}`, 7)}`,
          expiry: d.expiresOn ? formatDate(d.expiresOn) : 'Not applicable',
          country: /Swedish/.test(d.label) ? 'Sweden' : 'United Kingdom',
        }))
      : person.document
        ? [
            {
              type: documentName(person.document),
              number:
                person.document.number ??
                `Ends ${person.document.numberLastTwo}`,
              expiry: formatDate(person.document.expiresOn),
              country: person.document.issuingCountry,
            },
          ]
        : []
  docs.forEach((d, i) => {
    const group =
      docs.length > 1
        ? `Document relied on ${i + 1} of ${docs.length}`
        : 'Document relied on'
    fields.push(
      { key: `doc-${i}-type`, group, label: 'Document', value: d.type },
      {
        key: `doc-${i}-number`,
        group,
        label: 'Reference number',
        value: d.number,
      },
      { key: `doc-${i}-expiry`, group, label: 'Expiry date', value: d.expiry },
      {
        key: `doc-${i}-country`,
        group,
        label: 'Country of issue',
        value: d.country,
      },
    )
  })
  fields.push(
    {
      key: 'method',
      group: 'How identity was verified',
      label: 'Verification method',
      value:
        vc.option === 2
          ? 'Person check by a trained reviewer (Option 2)'
          : 'Identity verification technology (IDVT), Option 1',
    },
    {
      key: 'satisfied',
      group: 'How identity was verified',
      label: 'Date the ACSP became satisfied',
      value: vc.decision
        ? formatDateTime(vc.decision.decidedAt)
        : 'Not decided',
    },
    {
      key: 'acsp',
      group: 'The ACSP',
      label: 'ACSP registration reference',
      value: `${acsp.acspNumber} (${acsp.name})`,
    },
    {
      key: 'statement',
      group: 'The ACSP',
      label: 'Confirmation statement',
      value: `I confirm that I have verified the identity of ${fullName(person)} to the standard required by the Companies House identity verification standard.`,
    },
  )
  return fields
}
