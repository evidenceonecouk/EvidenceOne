import { container } from '../parts'
import { ProductStage } from '../stage/ProductStage'
import { RuleKicker } from './Hero'

const capabilities = [
  'Companies House identity standard',
  'Option 1 certified IDVT',
  'Passport chip read in the app',
  'Liveness and face match',
  'PEP and sanctions screening',
  'Exact register match',
  'ACSP04 corrections',
  'GOV.UK One Login handoff',
  'Seven-year records',
  'Hash-chained audit trail',
]

/** The real product, shown working: case review with the app's chip scan in front. */
export function SeeItWorking() {
  return (
    <section aria-labelledby="see-title" className="bg-white pt-24">
      <div className={`${container} mb-12 text-center`}>
        <RuleKicker className="justify-center">The product</RuleKicker>
        <h2
          id="see-title"
          className="mx-auto mt-6 max-w-3xl text-[2.5rem] leading-[1.05] font-normal tracking-[-0.04em] text-ink sm:text-[3.25rem]"
        >
          Every check, every decision, in front of the reviewer.
        </h2>
      </div>
      <ProductStage />
      <div
        className="mask-fade-x mx-auto max-w-[88rem] overflow-hidden py-12"
        aria-label="Capabilities"
      >
        <ul className="animate-marquee flex w-max gap-12">
          {[...capabilities, ...capabilities].map((c, i) => (
            <li
              key={`${c}-${i}`}
              aria-hidden={i >= capabilities.length}
              className="flex items-center gap-12 font-mono text-[0.875rem] tracking-[0.14em] whitespace-nowrap text-slate uppercase"
            >
              {c}
              <span
                aria-hidden="true"
                className="size-1.5 rotate-45 bg-silver"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
