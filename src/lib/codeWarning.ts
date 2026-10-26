import { defaultParams } from '@/data/rules'
import type { CaseMessage, CodeKind } from '@/types/domain'

/*
  Codes from Companies House (P4, decided 19 and 20 October). The individual may
  pass the personal code, or the company authentication code, to the allocated
  ACSP as a code message. Evidence One only carries it: only the allocated ACSP
  reviewer and the individual can open it, and the text is deleted
  automatically 30 days after the ACSP marks it received. If ordinary message
  text looks like a code, a gentle prompt suggests the code message. It never
  blocks the message.
*/

/** Days after "Code received" before the text is deleted (code_message_retention_days). */
export const CODE_MESSAGE_RETENTION_DAYS =
  defaultParams.code_message_retention_days

export const CODE_KIND_LABEL: Record<CodeKind, string> = {
  personal_code: 'Personal code',
  company_authentication_code: 'Company authentication code',
}

export const codeCarrierLine = (acspName: string) =>
  `Evidence One only carries this message to ${acspName}. It does not use the code.`

export const codePrompt = (acspName: string) =>
  `This looks like a code. Send it as a code message so only ${acspName} can see it and it is deleted after 30 days.`

export const isCodeMessage = (m: CaseMessage) => m.kind === 'code'

/** Ordinary messages only. Every export, Partner, platform staff and Copilot view uses this. */
export const ordinaryMessages = (messages: CaseMessage[] | undefined) =>
  (messages ?? []).filter((m) => !isCodeMessage(m))

/** Deleted once deletedAt is set, or once deleteOn has passed. */
export function codeDeleted(m: CaseMessage, now = Date.now()): boolean {
  return (
    !!m.deletedAt || (!!m.deleteOn && new Date(m.deleteOn).getTime() <= now)
  )
}

/** The deletion date, 30 days after the ACSP marks the code received. */
export function codeDeleteOn(receivedAt: string): string {
  return new Date(
    new Date(receivedAt).getTime() + CODE_MESSAGE_RETENTION_DAYS * 86_400_000,
  ).toISOString()
}

/**
  True when the text looks like a personal code or a company authentication
  code: a standalone run of 6 to 8 letters or digits that mixes digits, or a
  phrase such as "my code is" or "authentication code" followed by characters.
*/
export function looksLikeCode(text: string): boolean {
  if (
    /\b(personal|authentication|auth)\s+code\b[^.\n]{0,20}\b[A-Z0-9]{5,8}\b/i.test(
      text,
    )
  )
    return true
  if (/\b(my|the)\s+code\s+(is|:)\s*[A-Z0-9]{5,8}\b/i.test(text)) return true
  return (
    /\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,8}\b/.test(text) ||
    /(?<![\w£/.-])\d{6}(?![\w/.-])/.test(text)
  )
}
