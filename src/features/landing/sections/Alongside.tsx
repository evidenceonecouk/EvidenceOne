import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { alongsideCopy as copy } from '@/data/copy'
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
        <RuleKicker>{copy.kicker}</RuleKicker>
        <SectionTitle
          id="alongside-title"
          className="mt-6 max-w-4xl text-ink lg:text-[3rem]"
        >
          {copy.title}
        </SectionTitle>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-graphite">
          {copy.lead}
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-[24px] border border-line bg-white p-7 sm:p-9">
            <p className="font-mono text-[0.875rem] tracking-[0.14em] text-slate uppercase">
              {copy.govuk.label}
            </p>
            <h3 className="mt-3 text-[1.75rem] leading-tight font-normal tracking-[-0.03em] text-ink">
              {copy.govuk.title}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-graphite">
              {copy.govuk.body}
            </p>
          </article>

          <article className="flex flex-col rounded-[24px] border border-ink bg-ink p-7 text-paper sm:p-9">
            <p className="font-mono text-[0.875rem] tracking-[0.14em] text-paper/70 uppercase">
              {copy.evidenceOne.label}
            </p>
            <h3 className="mt-3 text-[1.75rem] leading-tight font-normal tracking-[-0.03em]">
              {copy.evidenceOne.title}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-paper/85">
              {copy.evidenceOne.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <Link
                to="/verify"
                onClick={() => setPersona('b2c')}
                className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-base font-medium text-ink hover:bg-white"
              >
                {copy.evidenceOne.verifyCta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/verify?from=govuk"
                onClick={() => setPersona('b2c')}
                className="inline-flex items-center gap-2 py-2.5 text-base font-medium text-paper underline underline-offset-4 hover:text-white"
              >
                {copy.evidenceOne.govukCta}
              </Link>
            </div>
          </article>
        </div>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-graphite">
          {copy.professionals}
        </p>
      </div>
    </section>
  )
}
