import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { formatMoney, VERIFICATION_FEE } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { Kicker, container } from '../parts'
import { ProductStage } from '../stage/ProductStage'

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

export function Hero() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="hero-title" className="bg-white">
      <div className={`${container} pt-16 pb-14 text-center sm:pt-24 lg:pt-28 lg:pb-16`}>
        <Kicker className="animate-rise">Companies House identity verification</Kicker>
        <h1
          id="hero-title"
          className="animate-rise mt-6 text-[3.25rem] leading-[0.98] font-normal tracking-[-0.05em] text-ink [animation-delay:60ms] sm:text-[4.75rem] lg:text-[6rem]"
        >
          One identity. One record.
          <br />
          <span className="text-[#7b8188]">Proof that lasts.</span>
        </h1>
        <p className="animate-rise mx-auto mt-7 max-w-[42rem] text-lg leading-relaxed text-graphite [animation-delay:120ms] sm:text-xl">
          The platform ACSPs and Agents use to prepare, evidence and record identity verification for company directors
          and PSCs. Every decision is made by a qualified person.
        </p>
        <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/verify" onClick={() => setPersona('b2c')}>
              Verify my identity
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to="/agent" onClick={() => setPersona('agent')}>
              Open the Agent portal
            </Link>
          </Button>
        </div>
        <p className="animate-rise mt-5 text-base text-slate [animation-delay:240ms]">
          {formatMoney(VERIFICATION_FEE)} per verification, or nothing to pay with an Agent Payment Code
        </p>
      </div>

      <div className="animate-rise [animation-delay:200ms]">
        <ProductStage />
      </div>

      <div className="mask-fade-x mx-auto max-w-[88rem] overflow-hidden py-12" aria-label="Capabilities">
        <ul className="animate-marquee flex w-max gap-12">
          {[...capabilities, ...capabilities].map((c, i) => (
            <li
              key={`${c}-${i}`}
              aria-hidden={i >= capabilities.length}
              className="flex items-center gap-12 font-mono text-[0.875rem] tracking-[0.14em] whitespace-nowrap text-slate uppercase"
            >
              {c}
              <span aria-hidden="true" className="size-1.5 rotate-45 bg-silver" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
