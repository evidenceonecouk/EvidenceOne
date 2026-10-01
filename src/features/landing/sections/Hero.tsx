import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { EyeHero } from '@/components/visual/EyeHero'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { useDemoStore } from '@/store/DemoStore'
import { container } from '../parts'

/** Kicker with a trailing rule, as in the client's design. */
export function RuleKicker({ children, className = '', tone = 'light' }: { children: React.ReactNode; className?: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={`flex items-center gap-4 text-[0.8125rem] font-medium tracking-[0.28em] uppercase ${tone === 'light' ? 'text-graphite' : 'text-paper/70'} ${className}`}>
      {children}
      <span aria-hidden="true" className={`h-px w-12 ${tone === 'light' ? 'bg-silver' : 'bg-white/30'}`} />
    </p>
  )
}

const focusEye = (on: boolean) => () => window.dispatchEvent(new CustomEvent('eye:focus', { detail: on }))

export function Hero() {
  const { data, setPersona } = useDemoStore()
  const inReview = data.cases.filter((c) => c.acspId === PRIMARY_ACSP_ID && c.status === 'in_review').length
  const verified = data.cases.filter((c) => c.status === 'submitted').length

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-[#f4f4f3]">
      {/* Interactive eye, full bleed on the right */}
      <div className="relative h-[22rem] sm:h-[28rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[56%]">
        <EyeHero className="absolute inset-0" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-[#f4f4f3] via-[#f4f4f3]/60 to-transparent lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f4f4f3] to-transparent lg:hidden" />
        <div aria-hidden="true" className="pointer-events-none absolute right-8 bottom-10 hidden text-[0.75rem] leading-[2.1] font-medium tracking-[0.34em] text-white uppercase [text-shadow:0_1px_10px_rgb(0_0_0/0.45)] xl:block">
          <p>Clearer</p>
          <p>practice.</p>
          <p>Stronger</p>
          <p>businesses.</p>
          <span className="my-5 block h-px w-12 bg-white/70" />
          <p>A more</p>
          <p>transparent</p>
          <p>tomorrow.</p>
        </div>
        <p className="pointer-events-none absolute top-6 left-[42%] hidden rounded-full bg-ink/70 px-3.5 py-1.5 font-mono text-[0.75rem] tracking-[0.14em] text-paper/90 uppercase backdrop-blur lg:block">
          Move your cursor · it follows
        </p>
      </div>

      <div className={`${container} relative pt-10 pb-16 lg:min-h-[44rem] lg:pt-24 lg:pb-24`}>
        <div className="max-w-[38rem]">
          <RuleKicker className="animate-rise">Infrastructure for Companies House</RuleKicker>
          <h1 id="hero-title" className="mt-7 text-[2.875rem] leading-[1] font-[450] tracking-[-0.05em] text-ink sm:text-[4rem] lg:text-[4.5rem]">
            <span className="reveal-line">
              <span>Companies House.</span>
            </span>
            <span className="reveal-line">
              <span className="[animation-delay:90ms]">One simpler</span>
            </span>
            <span className="reveal-line">
              <span className="[animation-delay:180ms]">connection.</span>
            </span>
          </h1>
          <p className="animate-rise mt-6 max-w-[34rem] text-[1.375rem] leading-[1.3] tracking-[-0.02em] text-[#6d7279] [animation-delay:280ms] sm:text-[1.75rem]">
            Infrastructure connecting businesses with ACSPs to verify, submit and file.
          </p>

          <div className="animate-rise mt-10 grid gap-6 [animation-delay:360ms] sm:grid-cols-2">
            <div>
              <Button asChild size="lg" className="group h-15 w-full rounded-full text-lg shadow-[0_14px_30px_-14px_rgb(22_24_27/0.7)]">
                <Link to="/acsp/queue" onClick={() => setPersona('reviewer')} onMouseEnter={focusEye(true)} onMouseLeave={focusEye(false)} onFocus={focusEye(true)} onBlur={focusEye(false)}>
                  I'm an ACSP
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-3 px-2 text-base leading-snug text-graphite">Bring your clients and manage everything in one place.</p>
            </div>
            <div>
              <Button asChild size="lg" variant="outline" className="group h-15 w-full rounded-full border-ink/25 bg-white/80 text-lg backdrop-blur">
                <Link to="/verify" onClick={() => setPersona('b2c')} onMouseEnter={focusEye(true)} onMouseLeave={focusEye(false)} onFocus={focusEye(true)} onBlur={focusEye(false)}>
                  I need an ACSP
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-3 px-2 text-base leading-snug text-graphite">Get connected with a regulated ACSP and complete your verification.</p>
            </div>
          </div>

          <div className="animate-rise mt-10 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-line bg-white/70 py-2 pr-5 pl-3 text-[0.9375rem] text-graphite backdrop-blur [animation-delay:440ms]">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-approve/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-approve" />
            </span>
            <span>
              <span className="font-medium text-ink tabular">{inReview}</span> in review now
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-line" />
            <span>
              <span className="font-medium text-ink tabular">{verified}</span> personal codes issued
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-line" />
            <span>36-hour decisions</span>
          </div>
        </div>
      </div>
    </section>
  )
}
