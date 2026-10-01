import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { EyeVisual } from '@/components/visual/EyeVisual'
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

export function Hero() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-[#f4f4f3]">
      {/* Macro eye, full bleed on the right */}
      <div className="relative h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
        <EyeVisual className="absolute inset-0" />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-[#f4f4f3] via-[#f4f4f3]/30 to-transparent lg:block lg:w-1/3" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f4f4f3] to-transparent lg:hidden" />
        <div className="absolute top-1/2 right-6 hidden -translate-y-1/2 text-[0.8125rem] leading-[2] font-medium tracking-[0.32em] text-white uppercase [text-shadow:0_1px_8px_rgb(0_0_0/0.35)] xl:block">
          <p>Clearer</p>
          <p>practice.</p>
          <p>Stronger</p>
          <p>businesses.</p>
          <span aria-hidden="true" className="my-5 block h-px w-12 bg-white/70" />
          <p>A more</p>
          <p>transparent</p>
          <p>tomorrow.</p>
        </div>
      </div>

      <div className={`${container} relative pt-10 pb-16 lg:pt-24 lg:pb-28`}>
        <div className="max-w-[40rem]">
          <RuleKicker className="animate-rise">Infrastructure for Companies House</RuleKicker>
          <h1
            id="hero-title"
            className="animate-rise mt-7 text-[2.75rem] leading-[1.02] font-normal tracking-[-0.045em] text-ink [animation-delay:60ms] sm:text-[3.75rem] lg:text-[4.25rem]"
          >
            Companies House.
            <br />
            One simpler connection.
          </h1>
          <p className="animate-rise mt-5 text-[1.5rem] leading-[1.25] font-normal tracking-[-0.02em] text-[#6d7279] [animation-delay:120ms] sm:text-[1.875rem]">
            Infrastructure connecting businesses with ACSPs to verify, submit and file.
          </p>

          <div className="animate-rise mt-10 grid gap-6 [animation-delay:180ms] sm:grid-cols-2">
            <div>
              <Button asChild size="lg" className="h-14 w-full rounded-full text-lg">
                <Link to="/acsp/queue" onClick={() => setPersona('reviewer')}>
                  I'm an ACSP
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-3 px-2 text-base leading-snug text-graphite">Bring your clients and manage everything in one place.</p>
            </div>
            <div>
              <Button asChild size="lg" variant="outline" className="h-14 w-full rounded-full border-ink/25 bg-white/70 text-lg">
                <Link to="/verify" onClick={() => setPersona('b2c')}>
                  I need an ACSP
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-3 px-2 text-base leading-snug text-graphite">Get connected with a regulated ACSP and complete your verification.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
