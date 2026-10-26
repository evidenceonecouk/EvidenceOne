import {
  BadgeCheck,
  ClipboardList,
  Landmark,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import { HeldOptionBadge } from '@/components/HeldOption'
import { modelCopy as copy } from '@/data/copy'
import { languages } from '@/data/i18n'
import { container } from '../parts'
import { RuleKicker } from './Hero'

const icons: LucideIcon[] = [
  UserRoundCheck,
  Landmark,
  ClipboardList,
  BadgeCheck,
]
const model = copy.cards.map((card, i) => ({ icon: icons[i], ...card }))

/** How the model works in plain words, then the six languages. */
export function Model() {
  const help = languages.filter((l) => l.code !== 'en')
  return (
    <section
      id="how-it-works"
      aria-labelledby="model-title"
      className="scroll-mt-20 bg-[#f4f4f3] pb-20"
    >
      <div className={container}>
        <div className="border-t border-line pt-10">
          <RuleKicker>{copy.kicker}</RuleKicker>
          <h2
            id="model-title"
            className="mt-6 max-w-3xl text-[2rem] leading-[1.08] font-normal tracking-[-0.035em] text-ink sm:text-[2.75rem]"
          >
            {copy.title}
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {model.map((m, i) => (
            <li
              key={m.title}
              className="flex flex-col rounded-[20px] border border-line bg-white/70 p-6"
            >
              <span className="flex items-center justify-between">
                <m.icon
                  className="size-8 text-ink"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.875rem] text-slate"
                >
                  0{i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-[1.25rem] leading-tight tracking-[-0.02em] text-ink">
                {m.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-graphite">
                {m.body}
              </p>
            </li>
          ))}
        </ol>

        <div
          id="languages"
          className="mt-8 rounded-[20px] border border-line bg-white/70 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="flex flex-wrap items-center gap-3 text-[1.375rem] tracking-[-0.02em] text-ink">
              {copy.languages.title}
              <HeldOptionBadge code="O1" />
            </h3>
            <p className="text-base text-graphite">{copy.languages.lead}</p>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {help.map((l) => (
              <li
                key={l.code}
                className="inline-flex items-baseline gap-2 rounded-full border border-line bg-white px-4 py-2 text-base text-ink"
              >
                <span>{l.label}</span>
                <span
                  lang={l.code === 'zh' ? 'zh-Hans' : l.code}
                  dir={l.dir}
                  className="text-graphite"
                >
                  {l.native}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.9375rem] text-graphite">
            {copy.languages.note}
          </p>
        </div>
      </div>
    </section>
  )
}
