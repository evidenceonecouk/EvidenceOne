import { hasChipStep } from '@/lib/chip'
import { DOCUMENT_LABEL } from '@/lib/identityChecks'
import { currentRuleSet } from '@/lib/rules'
import type { ChipResult, DemoData, IdDocumentType } from '@/types/domain'
import { updateJourney, type ActionResult } from './actions'

/*
  Actions for the identity step of the individual's journey. Every capture and
  every change of document is written to the audit trail. The checks run in the
  browser through the certified identity provider. Where the document has a
  chip, the provider's own chip reader on the person's phone reads it, inside
  the same provider journey. Evidence One has no app and does not read chips.
*/

type CaptureRoute = 'upload' | 'phone' | 'camera'

const routeText: Record<CaptureRoute, string> = {
  upload: 'uploaded from the computer',
  phone: 'captured on the person’s phone or tablet and returned to this case',
  camera: 'captured with the phone’s camera in the browser',
}

/** The document photo page or card was captured through the certified identity provider. */
export function recordDocumentCapture(
  data: DemoData,
  caseId: string,
  type: IdDocumentType,
  route: CaptureRoute,
): ActionResult {
  return updateJourney(
    data,
    caseId,
    { photoPageDone: true, captureRoute: route },
    {
      action: 'document.captured',
      detail: `${DOCUMENT_LABEL[type]} ${routeText[route]}. Passed to the certified identity provider once, for every check.`,
    },
  )
}

/** The selfie video for liveness and face match was captured on a phone or tablet. There is no webcam-only route. */
export function recordLivenessCapture(
  data: DemoData,
  caseId: string,
): ActionResult {
  return updateJourney(
    data,
    caseId,
    { selfieDone: true, livenessRoute: 'phone' },
    {
      action: 'liveness.captured',
      detail:
        'Selfie video captured on the person’s phone, for liveness and face match.',
    },
  )
}

const chipText: Record<Exclude<ChipResult, 'not_applicable'>, string> = {
  read: 'Chip read in the identity provider’s chip reader on the person’s phone. Chip signature validated by the certified identity provider.',
  not_read:
    'Chip not read: the person could not complete the chip step. The case continues and records that no chip was read. IDVT-01 gives the reviewer a Mandatory decision.',
}

/** The chip step inside the provider journey. Only the result is recorded, never chip data. */
export function recordChipResult(
  data: DemoData,
  caseId: string,
  result: Exclude<ChipResult, 'not_applicable'>,
): ActionResult {
  return updateJourney(
    data,
    caseId,
    { chipResult: result },
    {
      action: result === 'read' ? 'chip.read' : 'chip.not_read',
      actorType: 'system',
      detail: chipText[result],
    },
  )
}

/**
  Desktop: the whole provider journey (document, chip where it applies,
  selfie video) is finished on the person's phone or tablet, then the desktop
  screen shows the result. The return is simulated in the demo.
*/
export function recordPhoneJourney(
  data: DemoData,
  caseId: string,
  chip: Exclude<ChipResult, 'not_applicable'> = 'read',
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  const type = vc?.journey?.documentType ?? person?.document?.type ?? 'passport'
  const steps: ((d: DemoData) => ActionResult)[] = [
    (d) => recordDocumentCapture(d, caseId, type, 'phone'),
    ...(hasChipStep(person?.document, type)
      ? [(d: DemoData) => recordChipResult(d, caseId, chip)]
      : []),
    (d) => recordLivenessCapture(d, caseId),
  ]
  return steps.reduce<ActionResult>(
    (acc, step) => {
      const r = step(acc.data)
      return { data: r.data, audit: [...acc.audit, ...r.audit] }
    },
    { data, audit: [] },
  )
}

/** The choice of document. An eVisa is an accepted Option 1 document, checked by the provider with the Home Office. */
export function chooseDocument(
  data: DemoData,
  caseId: string,
  type: IdDocumentType,
  eVisa: boolean,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const changed = vc?.journey?.documentType !== type
  return updateJourney(
    data,
    caseId,
    {
      documentType: type,
      eVisa,
      ...(changed
        ? {
            photoPageDone: false,
            captureRoute: undefined,
            chipResult: undefined,
            checksDone: false,
          }
        : {}),
    },
    {
      action: 'document.chosen',
      detail: eVisa
        ? `eVisa holder: the certified identity provider checks the eVisa directly with the Home Office, with the ${DOCUMENT_LABEL[type].toLowerCase()} linked to it. Option 1.`
        : `${DOCUMENT_LABEL[type]} chosen as the one identity document, checked through the certified identity provider.`,
    },
  )
}

/**
  IDVT-07: a check did not pass and attempts remain. The person records another
  go at the selfie. After idvt_attempts, IDVT-08 offers Option 2.
*/
export function recordCheckFailure(
  data: DemoData,
  caseId: string,
  what: 'liveness' | 'face_match' | 'document',
): ActionResult & { exhausted: boolean } {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [], exhausted: false }
  const max = currentRuleSet(data).params.idvt_attempts
  const attempts = (vc.journey?.checkAttempts ?? 0) + 1
  const exhausted = attempts >= max
  const label =
    what === 'liveness'
      ? 'Liveness'
      : what === 'face_match'
        ? 'Face match'
        : 'Document check'
  const result = updateJourney(
    data,
    caseId,
    {
      checkAttempts: attempts,
      checksDone: false,
      ...(what === 'document'
        ? {
            photoPageDone: false,
            captureRoute: undefined,
            chipResult: undefined,
          }
        : { selfieDone: false, livenessRoute: undefined }),
    },
    {
      action: 'idvt.check_failed',
      actorType: 'system',
      detail: exhausted
        ? `${label} did not pass. Attempt ${attempts} of ${max}. IDVT-08: all attempts used, Option 2 offered.`
        : `${label} did not pass. Attempt ${attempts} of ${max}. IDVT-07: the person may try again.`,
    },
  )
  return { ...result, exhausted }
}

/** DOC-EXP-01 to DOC-EXP-03: the document has expired, so the person moves to another Option 1 document. */
export function switchDocument(
  data: DemoData,
  caseId: string,
  type: IdDocumentType,
): ActionResult {
  return updateJourney(
    data,
    caseId,
    {
      documentType: type,
      expiredChoice: 'other_document',
      eVisa: false,
      photoPageDone: false,
      captureRoute: undefined,
      chipResult: undefined,
      selfieDone: false,
      livenessRoute: undefined,
      checksDone: false,
    },
    {
      action: 'document.replaced',
      detail: `DOC-EXP-01: an expired passport is not accepted, so another document was asked for (a Request, never a Halt). ${DOCUMENT_LABEL[type]} chosen, checked through the certified identity provider.`,
    },
  )
}
