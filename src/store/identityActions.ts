import { DOCUMENT_LABEL, GROUP_B_DOCUMENTS } from '@/lib/identityChecks'
import { fullName } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import type { DemoData, IdDocumentType } from '@/types/domain'
import { updateJourney, type ActionResult } from './actions'

/*
  Actions for the identity step of the individual's journey. Every capture and
  every change of document is written to the audit trail. The checks run in the
  browser through the certified identity provider; Evidence One does not read
  a passport chip.
*/

type CaptureRoute = 'upload' | 'phone' | 'camera'
type LivenessRoute = 'phone' | 'computer'

const routeText: Record<CaptureRoute, string> = {
  upload: 'uploaded from the computer',
  phone: 'captured in the phone’s browser and returned to this case',
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

/** The selfie video for liveness and face match was captured. */
export function recordLivenessCapture(
  data: DemoData,
  caseId: string,
  route: LivenessRoute,
): ActionResult {
  return updateJourney(
    data,
    caseId,
    { selfieDone: true, livenessRoute: route },
    {
      action: 'liveness.captured',
      detail:
        route === 'phone'
          ? 'Selfie video captured in the phone’s browser and returned to this case, for liveness and face match.'
          : 'Selfie video captured with this computer’s camera, for liveness and face match.',
    },
  )
}

/** The choice of document, including an eVisa holder's second document. */
export function chooseDocument(
  data: DemoData,
  caseId: string,
  type: IdDocumentType,
  eVisa: boolean,
  secondDocument?: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const changed = vc?.journey?.documentType !== type
  return updateJourney(
    data,
    caseId,
    {
      documentType: type,
      eVisa,
      eVisaSecondDocument: eVisa ? secondDocument : undefined,
      ...(changed
        ? { photoPageDone: false, captureRoute: undefined, checksDone: false }
        : {}),
    },
    {
      action: 'document.chosen',
      detail: eVisa
        ? `eVisa holder: ${DOCUMENT_LABEL[type].toLowerCase()} plus one Group B document (${secondDocument ?? GROUP_B_DOCUMENTS[0].toLowerCase()}), until the certified identity provider confirms an eVisa check in the browser.`
        : `${DOCUMENT_LABEL[type]} chosen as the one identity document, checked in the browser.`,
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
        ? { photoPageDone: false, captureRoute: undefined }
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

/** DOC-EXP-01 or IDVT-01 under the current setting: the person moves to another Option 1 document. */
export function switchDocument(
  data: DemoData,
  caseId: string,
  type: IdDocumentType,
  why: 'expired' | 'other_document',
): ActionResult {
  return updateJourney(
    data,
    caseId,
    {
      documentType: type,
      expiredChoice: why === 'expired' ? 'other_document' : undefined,
      photoPageDone: false,
      captureRoute: undefined,
      checksDone: false,
    },
    {
      action: 'document.replaced',
      detail:
        why === 'expired'
          ? `DOC-EXP-01: the document has expired, so another document was asked for. ${DOCUMENT_LABEL[type]} chosen, checked in the browser.`
          : `IDVT-01 (chip_not_read_fallback): another Option 1 document was asked for. ${DOCUMENT_LABEL[type]} chosen, checked in the browser.`,
    },
  )
}

/** ADDL-01: continue with the expired document and send one supporting document. A Request, never a Halt. */
export function continueWithSupportingDocument(
  data: DemoData,
  caseId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  return updateJourney(
    data,
    caseId,
    { expiredChoice: 'supporting_document' },
    {
      action: 'document.expired_continue',
      detail: `${person ? fullName(person) : 'The individual'} continues with the expired document. ADDL-01: one supporting document will be requested. The reviewer decides.`,
    },
  )
}
