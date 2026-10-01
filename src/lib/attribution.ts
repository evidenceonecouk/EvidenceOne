/*
  The one source for the attribution wording. Evidence One prepares, evidences
  and records. It never verifies: the ACSP does.
*/
export function attributionText(acspName?: string): string {
  return acspName
    ? `Your identity verification is being conducted by ${acspName} using the Evidence One platform.`
    : 'Your identity verification is conducted by an Authorised Corporate Service Provider (ACSP) using the Evidence One platform.'
}
