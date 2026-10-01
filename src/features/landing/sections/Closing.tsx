import { Kicker, SectionTitle, container } from '../parts'

const standards = [
  ['Option 1', 'Certified IDVT', 'Digital verification is the default. A trained human check is a fallback only.'],
  ['Chip', 'Passport NFC read', 'Read in the app, where a browser cannot reach the chip.'],
  ['Screening', 'PEP and sanctions', 'Every person screened, every result shown to the reviewer.'],
  ['Register', 'Exact match', 'Name and date of birth compared with Companies House.'],
  ['Route B', 'ACSP04 corrections', 'Mismatches corrected on the register, never resubmitted.'],
  ['Submission', 'One Login handoff', 'A ready-to-copy pack, then the verification reference recorded.'],
  ['Retention', 'Seven years', 'Counted from the decision. Failed attempts kept too.'],
  ['Access', 'WCAG 2.2 AA', 'Large type, strong contrast and full keyboard use.'],
] as const

export function Standards() {
  return (
    <section aria-labelledby="standards-title" className="scroll-mt-20 bg-white py-24 lg:py-32">
      <div className={container}>
        <SectionTitle id="standards-title" className="mx-auto max-w-3xl text-center text-ink">
          Designed around the rules that matter
        </SectionTitle>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg text-graphite">
          Built to the Companies House identity verification standard, with every rule visible to the reviewer.
        </p>
        <ul className="mt-14 grid overflow-hidden rounded-[28px] border border-line sm:grid-cols-2 lg:grid-cols-4">
          {standards.map(([kicker, title, body]) => (
            <li key={title} className="-mt-px -ml-px flex min-h-[15rem] flex-col border-t border-l border-line p-7">
              <Kicker>{kicker}</Kicker>
              <p className="mt-auto text-[1.625rem] leading-tight font-normal tracking-[-0.02em] text-ink">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-graphite">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

