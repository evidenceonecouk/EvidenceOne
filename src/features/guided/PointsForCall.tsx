import { Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { PendingDecision } from '@/components/PendingDecision'

/*
  Presenter only. Not linked from any persona navigation: it opens from the
  Guided demo menu in the presenter bar. Every point is a client decision, so
  each carries the "Pending your decision" badge and nothing here chooses.
*/

interface Point {
  code?: string
  title: string
  summary: string
  /** When false the point is an option, not a decision. */
  pending?: boolean
}

const groups: {
  id: string
  title: string
  description?: string
  points: Point[]
}[] = [
  {
    id: 'urgent',
    title: 'Needs an answer on the call',
    points: [
      {
        code: 'H1',
        title: 'Expired passports while no chip is read',
        summary:
          'Until Companies House replies, an expired passport is asked for another document. Whether a recently expired passport can be accepted is open.',
      },
      {
        code: 'H2',
        title: 'SMS kept out of step-up',
        summary:
          'Step-up uses a passkey or authenticator code only, because of SIM swap risk. SMS stays for individuals’ one-time codes and mobile confirmation.',
      },
      {
        code: 'M2',
        title: 'Review window and signature',
        summary:
          'Acceptance closes on Thursday 15 October 2026 and signature is planned for Friday 16 October. To confirm.',
      },
      {
        code: 'M3',
        title: 'Referral Partner view of clients affected by a lapsed ACSP',
        summary:
          'Today only the Platform Administrator and the ACSP see the list. The client may want partners to see their own affected clients.',
      },
      {
        code: 'M4',
        title: 'Period to register, and the yearly upload',
        summary:
          'The time an ACSP has to register is not set. Whether the yearly list upload replaces the two-weekly check or sits beside it is open.',
      },
      {
        code: 'M7',
        title: 'Personal code prompt',
        summary:
          'The prompt asking the person to confirm the code has arrived comes the day after Companies House confirms. The code itself is never collected.',
      },
    ],
  },
  {
    id: 'provider',
    title: 'Certified identity provider',
    points: [
      {
        title: 'Which certified identity provider to use',
        summary:
          'The choice is open. One candidate has confirmed in writing the driving licence in the desktop browser and the webcam-only liveness route. The other candidate’s desktop route is unconfirmed, so mobile only at launch is a live question only if that one is chosen.',
      },
    ],
  },
  {
    id: 'storage',
    title: 'Storage and retention',
    description:
      'Shown on the Storage and retention page for the Platform Administrator.',
    points: [
      {
        title: 'Archive evidence after 12 months',
        summary:
          'Move evidence to cheaper storage after a year, or keep it live for the full seven years.',
      },
      {
        title: 'Full liveness media, or stills plus the provider result',
        summary:
          'What to keep from the liveness check. Raw biometric samples are deleted within 30 days either way.',
      },
      {
        title: 'Upload limit',
        summary: 'Proposed at 10 MB a file and five files per request.',
      },
      {
        title: 'ACSP keeps its own retention',
        summary:
          'Whether an ACSP can export its records and have them removed from the platform.',
      },
      {
        title: 'Storage included in subscriptions, or capped',
        summary:
          'Whether storage is part of the subscription price or limited to a number of cases.',
      },
    ],
  },
  {
    id: 'points',
    title: 'Open points from the Gate 1 review',
    points: [
      {
        code: 'P1',
        title: 'Companies House reply on chip reading',
        summary:
          'Does Option 1 require the chip to be read? The setting for a chip that is not read stays on the Rules page until she replies.',
      },
      {
        code: 'P2',
        title: 'How Route B is sold',
        summary:
          'Whether filings are sold per filing, in tiers, or inside the subscription.',
      },
      {
        code: 'P3',
        title: 'Proof of address wording',
        summary:
          'The exact wording of the request for proof of address within six months.',
      },
      {
        code: 'P4',
        title: 'Passing codes to the ACSP',
        summary:
          'How a client passes the personal code and the company authentication code to the ACSP. Until then the platform never collects, stores or relays either.',
      },
      {
        code: 'P5',
        title: 'Which form "ACSP04" means',
        summary:
          'Corrections to a submitted verification use ACSP04. Which Companies House form that is, is to be confirmed.',
      },
      {
        code: 'P6',
        title: 'PEP and sanctions screening',
        summary:
          'Optional for each ACSP, and the default is open. Ongoing monitoring stays off.',
      },
      {
        code: 'P7',
        title: 'AI processing location',
        summary:
          'Proposed: built in London, no training on the data, no retention.',
      },
      {
        code: 'P8',
        title: 'Ranking for ACSP suggestions',
        summary:
          'The order in which ACSPs are suggested to a direct client. Ranked by clear criteria, not AI.',
      },
      {
        code: 'P9',
        title: 'Translation reviewer',
        summary: 'Who reviews each language before go-live. To be named.',
      },
      {
        code: 'P10',
        title: 'Refunds and complaints',
        summary:
          'Who handles a refund or a complaint, the ACSP or the platform, and how the individual is told.',
      },
      {
        code: 'P11',
        title: 'Referral Partners outside the UK',
        summary:
          'Partners outside the UK see status only, pending her data protection impact assessment.',
      },
    ],
  },
  {
    id: 'options',
    title: 'Options priced separately',
    points: [
      {
        code: 'O1',
        title: 'Language help',
        summary: 'Pre-written guidance and translation labelled as advisory.',
        pending: false,
      },
      {
        code: 'O2',
        title: 'Route B Tier 1',
        summary: 'Prepared filings and register corrections.',
        pending: false,
      },
      {
        code: 'O3',
        title: 'Bank statement redaction',
        summary:
          'The person previews and confirms the redaction. Only the redacted copy reaches the ACSP.',
        pending: false,
      },
    ],
  },
]

function PointRow({ p }: { p: Point }) {
  return (
    <li className="grid gap-2 px-5 py-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-5 sm:px-6">
      <span className="font-mono text-[0.9375rem] text-slate">
        {p.code ?? ''}
      </span>
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] font-medium text-ink">{p.title}</h3>
        <p className="mt-1 text-base leading-relaxed text-slate">{p.summary}</p>
      </div>
      {p.pending === false ? (
        <span className="inline-flex w-fit rounded-full border border-line px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-graphite">
          Priced separately
        </span>
      ) : (
        <PendingDecision code={p.code} className="w-fit" />
      )}
    </li>
  )
}

export function PointsForCall() {
  return (
    <Page width="narrow">
      <PageHeader
        kicker="Presenter only"
        title="Points for the call"
        description="The open decisions for the client. Nothing here is chosen on her behalf: each is built as a setting and marked Pending your decision."
      />
      <div className="space-y-6">
        {groups.map((g) => (
          <Panel key={g.id} aria-labelledby={`g-${g.id}`}>
            <PanelHeader
              id={`g-${g.id}`}
              title={g.title}
              description={g.description}
            />
            <ul className="divide-y divide-line/80">
              {g.points.map((p) => (
                <PointRow key={p.title} p={p} />
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </Page>
  )
}
