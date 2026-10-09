import { Kicker, SectionTitle, container } from '../parts'

const standards = [
  [
    'Option 1',
    'Certified IDVT',
    'Digital verification is the default. A trained human check is a fallback only.',
  ],
  [
    'Browser',
    'Desktop and mobile',
    'Document, liveness and face match in the browser, with no app to install.',
  ],
  [
    'Screening',
    'PEP and sanctions',
    'Where switched on for the ACSP, with every result shown to the reviewer.',
  ],
  [
    'Register',
    'Differences flagged',
    'Details compared with Companies House. The reviewer decides on any difference.',
  ],
  [
    'Route B',
    'Register corrections',
    'Genuine register corrections are filed separately, never as a resubmission.',
  ],
  [
    'Submission',
    'One Login handoff',
    'A prepared submission, then the verification reference recorded.',
  ],
  [
    'Retention',
    'Seven years',
    'Counted from the decision. Failed attempts kept too.',
  ],
  [
    'Access',
    'WCAG 2.2 AA',
    'Large type, strong contrast and full keyboard use.',
  ],
] as const

export function Standards() {
  return (
    <section
      aria-labelledby="standards-title"
      className="scroll-mt-20 bg-white py-24 lg:py-32"
    >
      <div className={container}>
        <SectionTitle
          id="standards-title"
          className="mx-auto max-w-3xl text-center text-ink"
        >
          Designed around the rules that matter
        </SectionTitle>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg text-graphite">
          Built to the Companies House identity verification standard, with
          every rule visible to the reviewer.
        </p>
        <ul className="mt-14 grid overflow-hidden rounded-[28px] border border-line sm:grid-cols-2 lg:grid-cols-4">
          {standards.map(([kicker, title, body]) => (
            <li
              key={title}
              className="-mt-px -ml-px flex min-h-[15rem] flex-col border-t border-l border-line p-7"
            >
              <Kicker>{kicker}</Kicker>
              <p className="mt-auto text-[1.625rem] leading-tight font-normal tracking-[-0.02em] text-ink">
                {title}
              </p>
              <p className="mt-2 text-base leading-relaxed text-graphite">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
