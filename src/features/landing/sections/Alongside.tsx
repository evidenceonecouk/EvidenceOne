import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { useDemoStore } from '@/store/DemoStore'
import { SectionTitle, container } from '../parts'
import { RuleKicker } from './Hero'

/*
  The note that people with a chipped passport and a compatible phone can use
  the free GOV.UK ID Check app lives here, on the main page only. It describes
  how the two routes differ and does not criticise GOV.UK.
*/
export function Alongside() {
  const { setPersona } = useDemoStore()
  return (
    <section
      id="govuk"
      aria-labelledby="alongside-title"
      className="scroll-mt-20 bg-[#f4f4f3] py-20 lg:py-24"
    >
      <div className={container}>
        <RuleKicker>Two routes, one register</RuleKicker>
        <SectionTitle
          id="alongside-title"
          className="mt-6 max-w-4xl text-ink lg:text-[3rem]"
        >
          Evidence One sits alongside the free GOV.UK ID Check app.
        </SectionTitle>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-graphite">
          Both routes end with your identity verified for Companies House. They
          suit different people, so choose the one that fits you.
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-[24px] border border-line bg-white p-7 sm:p-9">
            <p className="font-mono text-[0.875rem] tracking-[0.14em] text-slate uppercase">
              Free, from GOV.UK
            </p>
            <h3 className="mt-3 text-[1.75rem] leading-tight font-normal tracking-[-0.03em] text-ink">
              The GOV.UK ID Check app
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-graphite">
              If you have a passport with a chip and a compatible smartphone,
              you can verify your identity yourself, at no cost, with the free
              GOV.UK ID Check app. Many people finish in a few minutes.
            </p>
          </article>

          <article className="flex flex-col rounded-[24px] border border-ink bg-ink p-7 text-paper sm:p-9">
            <p className="font-mono text-[0.875rem] tracking-[0.14em] text-paper/70 uppercase">
              With an ACSP you choose
            </p>
            <h3 className="mt-3 text-[1.75rem] leading-tight font-normal tracking-[-0.03em]">
              Evidence One, in your browser
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-paper/85">
              Your named ACSP carries out the verification using the Evidence
              One platform, on a laptop or a phone. It suits you if you do not
              have a compatible phone or a chipped document, if you want guided
              help with your documents, or if you want help in your own
              language. The ACSP's fee is shown before you pay.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <Link
                to="/verify"
                onClick={() => setPersona('b2c')}
                className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-base font-medium text-ink hover:bg-white"
              >
                Verify my identity
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/verify?from=govuk"
                onClick={() => setPersona('b2c')}
                className="inline-flex items-center gap-2 py-2.5 text-base font-medium text-paper underline underline-offset-4 hover:text-white"
              >
                Had trouble with the GOV.UK app?
              </Link>
            </div>
          </article>
        </div>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-graphite">
          Professionals who look after several directors and people with
          significant control use Evidence One to send invites, follow every
          case in one place and keep an audit trail.
        </p>
      </div>
    </section>
  )
}
