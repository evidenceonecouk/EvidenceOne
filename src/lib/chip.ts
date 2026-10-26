import type {
  ChipResult,
  IdDocument,
  IdDocumentType,
  VerificationCase,
} from '@/types/domain'

/*
  Chip reading belongs to the certified identity provider: its own chip reader,
  on the person's phone, inside the same provider journey. Evidence One has no
  app and never reads a chip. These helpers only say whether the step applies
  and what the provider recorded.
*/

/** The provider's journey has a chip step when the document has a chip. A UK photocard driving licence never does. */
export function hasChipStep(
  doc: Pick<IdDocument, 'type' | 'hasChip'> | undefined,
  type?: IdDocumentType,
): boolean {
  const t = type ?? doc?.type
  return !!doc?.hasChip && doc.type === t && t !== 'driving_licence'
}

/**
  The chip result recorded on a case. Seeded cases recorded before the chip
  step existed are read as "read" where the document has a chip and the checks
  completed, which is the normal Option 1 outcome.
*/
export function chipResultFor(
  vc: VerificationCase,
  doc: Pick<IdDocument, 'type' | 'hasChip'> | undefined,
): ChipResult | undefined {
  if (vc.idvt.chipResult) return vc.idvt.chipResult
  if (vc.option !== 1) return 'not_applicable'
  if (!hasChipStep(doc, vc.journey?.documentType ?? doc?.type))
    return 'not_applicable'
  if (vc.journey?.chipResult) return vc.journey.chipResult
  return vc.idvt.completedAt ? 'read' : undefined
}

export const chipResultLabel: Record<ChipResult, string> = {
  read: 'Chip read',
  not_read: 'No chip read',
  not_applicable: 'Not applicable, the document has no chip',
}

/** The security features the certified identity provider validated, in plain words. */
export function securityFeaturesFor(
  vc: VerificationCase,
  doc: Pick<IdDocument, 'type' | 'hasChip'> | undefined,
  eVisa = !!vc.journey?.eVisa,
): string[] {
  if (vc.idvt.securityFeatures) return vc.idvt.securityFeatures
  if (!doc || vc.option !== 1 || !vc.idvt.completedAt) return []
  const out = [
    'Physical security features (hologram, optically variable ink, printing)',
  ]
  if (doc.type !== 'driving_licence') out.push('Machine-readable zone')
  else out.push('Licence number and format checks')
  if (chipResultFor(vc, doc) === 'read')
    out.push('Chip signature and data (cryptographic check)')
  if (eVisa) out.push('eVisa status checked with the Home Office')
  return out
}
