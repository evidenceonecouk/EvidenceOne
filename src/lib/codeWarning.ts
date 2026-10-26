/*
  Messages carry no codes (client email of 23 October, G2-12 and G2-18). The
  case messages are for verification-related communication only. Evidence One
  does not ask for, collect or intentionally store Companies House codes,
  passwords or other credentials. Companies House sends the personal code
  directly to the person.

  Design interpretation of "does not intentionally store": a message that looks
  like a code is not sent until the person edits it, and the flagged text is
  not saved. Confirm the wording and the blocking with the client.
*/

/** Always shown under the message composer, for the individual and the ACSP. */
export const MESSAGE_NOTICE =
  'Messages are for questions about the verification. Please do not send Companies House codes, passwords or other access credentials here. Companies House sends the personal code directly to the person.'

/** Shown when the text looks like a code. The message is not sent until it is edited. */
export const codeBlockedMessage = (acspName: string) =>
  `This looks like a code. Please do not share it here. Evidence One does not ask for or keep Companies House codes. If ${acspName} needs a code for a later filing, agree with them how to pass it on outside Evidence One.`

/** The ACSP's own composer: the same warning, addressed to the reviewer. */
export const CODE_BLOCKED_ACSP =
  'This looks like a code. Please do not share it here. Evidence One does not ask for or keep Companies House codes. If you need a code for a later filing, agree with your client how they pass it to you outside Evidence One.'

/** Route A submission workspace and anywhere an ACSP might need a code for a later filing. */
export const LATER_FILING_CODE_LINE =
  'If you need a code for a later filing, agree with your client how they pass it to you. Evidence One does not carry or keep it.'

/**
  True when the text looks like a personal code or a company authentication
  code: a standalone run of 6 to 8 letters or digits that mixes digits, or a
  phrase such as "my code is" or "authentication code" followed by characters.
  Conservative on purpose.
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
    /\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,8}\b/i.test(text) ||
    /(?<![\w£/.-])\d{6}(?![\w/.-])/.test(text)
  )
}
