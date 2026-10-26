import { closingCopy as copy } from '@/data/copy'
import { Kicker, SectionTitle, container } from '../parts'

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
          {copy.title}
        </SectionTitle>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg text-graphite">
          {copy.lead}
        </p>
        <ul className="mt-14 grid overflow-hidden rounded-[28px] border border-line sm:grid-cols-2 lg:grid-cols-4">
          {copy.standards.map(({ kicker, title, body }) => (
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
