import { Analytics } from '@vercel/analytics/react'

const stages = [
  { label: 'Capture', state: 'done', grow: 3 },
  { label: 'Verify', state: 'done', grow: 3 },
  { label: 'Filing', state: 'active', grow: 4 },
  { label: 'Launch', state: 'next', grow: 2 },
] as const

const stats = [
  { k: 'Identity checks', v: 'Ready', done: true },
  { k: 'Evidence capture', v: 'Ready', done: true },
  { k: 'Public launch', v: 'Soon', done: false },
]

const Check = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export default function App() {
  return (
    <>
      <main className="shell">
        <div className="frame">
          <header className="top">
            <div className="brand">
              <span className="mark" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              <span className="brand-name">Evidence One</span>
            </div>
            <span className="status">
              <span className="dot" />
              In development
            </span>
          </header>

          <div className="bento">
            <section className="card hero" aria-labelledby="title">
              <p className="eyebrow">Companies House · ID verification</p>
              <div>
                <h1 id="title">
                  Identity verification for Companies House, <mark>done properly.</mark>
                </h1>
                <p className="lead">The interactive prototype is being polished. Check back shortly.</p>
              </div>
            </section>

            <section className="card progress" aria-label="Build progress">
              <div className="pg-head">
                <span>Build progress</span>
                <span className="pg-tag">Final polish</span>
              </div>
              <p className="pg-value">72<small>%</small></p>
              <div
                className="segs"
                role="progressbar"
                aria-label="Build progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={72}
              >
                {stages.map((s) => (
                  <span key={s.label} className={`seg ${s.state}`} style={{ flexGrow: s.grow }} />
                ))}
              </div>
              <div className="segs seg-labels" aria-hidden="true">
                {stages.map((s) => (
                  <span key={s.label} className={s.state} style={{ flexGrow: s.grow }}>{s.label}</span>
                ))}
              </div>
            </section>

            <section className="card note" aria-label="Evidence status">
              <div>
                <h2>Identity evidence complete</h2>
                <p>Documents reviewed and decision recorded</p>
              </div>
              <span className="note-check"><Check size={18} /></span>
            </section>

            <section className="stats" aria-label="Status">
              {stats.map((s) => (
                <div key={s.k} className="card stat">
                  <span className={`stat-icon ${s.done ? 'done' : ''}`}>
                    {s.done ? <Check size={13} /> : <span className="stat-dot" />}
                  </span>
                  <span className="stat-k">{s.k}</span>
                  <span className="stat-v">{s.v}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>
      <Analytics />
    </>
  )
}
