import { formatDate, fullName } from '@/lib/format'
import type { CorrectionTask, DemoData } from '@/types/domain'

export interface FilingField {
  key: string
  label: string
  value: string
  /** A code the filer enters at Companies House. No input and nothing to copy. */
  filerEntered?: boolean
}

/**
  The prepared filing, in the order the ACSP will enter it in its own WebFiling
  account. There is no field for the company authentication code or a One Login
  detail: the ACSP enters those itself and Evidence One never sees them.
*/
export function filingPack(data: DemoData, task: CorrectionTask) {
  const person = data.people.find((p) => p.id === task.personId)
  const company = data.companies.find((c) => c.number === task.companyNumber)
  const entry = data.register.find(
    (r) =>
      r.personId === task.personId && r.companyNumber === task.companyNumber,
  )
  const fields: FilingField[] = [
    { key: 'company', label: 'Company name', value: company?.name ?? '' },
    { key: 'number', label: 'Company number', value: task.companyNumber },
    {
      key: 'officer',
      label: 'Officer',
      value: person ? fullName(person) : task.personId,
    },
    {
      key: 'role',
      label: 'Role on the register',
      value:
        entry?.role === 'psc'
          ? 'Person with significant control'
          : entry?.role === 'director_psc'
            ? 'Director and person with significant control'
            : 'Director',
    },
    { key: 'field', label: 'Detail to correct', value: task.field },
    {
      key: 'current',
      label: 'Shown on the register now',
      value: task.registerValue,
    },
    { key: 'correct', label: 'Correct value', value: task.correctValue },
    {
      key: 'evidence',
      label: 'Evidence reference',
      value: `Case ${task.caseId}, opened ${formatDate(task.createdAt)}`,
    },
    {
      key: 'auth-code',
      label: 'Company authentication code',
      value: 'Entered by the filer at Companies House',
      filerEntered: true,
    },
    {
      key: 'code',
      label: 'Director personal code (if the form asks)',
      value: 'Entered by the filer at Companies House',
      filerEntered: true,
    },
  ]
  const checks = [
    'The correct value agrees with the identity document and the details the individual stated.',
    'The company number and officer match the Companies House register entry.',
    'The value on the register differs only in the detail named above.',
    'The filing is prepared for the instructing ACSP, which files it from its own account.',
  ]
  return { fields, checks }
}
