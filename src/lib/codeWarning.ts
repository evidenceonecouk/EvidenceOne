/*
  The personal code and the company authentication code are never collected,
  stored or relayed (CLAUDE.md). If someone types what looks like one into a case
  message, warn them and do not keep the text.
*/

export const CODE_WARNING =
  'Please do not share codes here. Companies House sends the personal code directly to the person.'

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
