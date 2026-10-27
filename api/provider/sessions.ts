// Server-side proxy for the certified identity provider's session reports.
// The key lives only in the server env var DIDIT_API_KEY and never reaches the browser.
// Only the sessions listed in DIDIT_SESSION_IDS can be read, so this is never an open
// window onto every session in the provider account. The reports hold real identity
// data, so they are released only with the password in PROVIDER_PASSWORD (sent in the
// x-demo-password header). With no password set, live data stays locked.
import { createHash, timingSafeEqual } from 'node:crypto'

const BASE = 'https://verification.didit.me/v3/session/'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Removed before anything leaves the server: links back to the provider, what each
// check costs (never shown to an ACSP), and matches against other people's sessions.
const DROP_TOP = [
  'cost_breakdown',
  'session_url',
  'callback',
  'blocklisted',
  'activity_reviews',
]
const DROP_ITEM = ['matches', 'document_selfie_face_matches']

type Json = Record<string, unknown>

function sanitise(decision: Json): Json {
  for (const key of DROP_TOP) delete decision[key]
  for (const value of Object.values(decision)) {
    if (!Array.isArray(value)) continue
    for (const item of value)
      if (item && typeof item === 'object')
        for (const key of DROP_ITEM) delete (item as Json)[key]
  }
  return decision
}

const digest = (s: string) => createHash('sha256').update(s).digest()
const NO_STORE = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }

function passwordOk(request: Request): boolean {
  const expected = process.env.PROVIDER_PASSWORD
  const given = request.headers.get('x-demo-password')
  if (!expected || !given) return false
  return timingSafeEqual(digest(given), digest(expected))
}

export async function GET(request: Request): Promise<Response> {
  const key = process.env.DIDIT_API_KEY
  const ids = (process.env.DIDIT_SESSION_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID.test(s))

  if (!key || ids.length === 0)
    return Response.json({ configured: false, sessions: [] })

  if (!passwordOk(request)) {
    // Slow down guessing. A long password does the rest.
    if (request.headers.get('x-demo-password'))
      await new Promise((r) => setTimeout(r, 1000))
    return Response.json(
      { configured: true, locked: true, sessions: [] },
      { status: 401, headers: NO_STORE },
    )
  }

  const results = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`${BASE}${id}/decision/?include=events`, {
        headers: { 'x-api-key': key, accept: 'application/json' },
      })
      if (!res.ok) return { id, error: res.status }
      return sanitise((await res.json()) as Json)
    }),
  )

  return Response.json(
    { configured: true, sessions: results },
    // Personal data and short-lived media links: never cached or indexed.
    { headers: NO_STORE },
  )
}
