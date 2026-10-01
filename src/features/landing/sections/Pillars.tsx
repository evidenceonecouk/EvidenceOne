import { FileStack, Fingerprint, Scale, Users, type LucideIcon } from 'lucide-react'
import { SectionTitle, container } from '../parts'

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Users, title: 'Prepare', body: 'Invites are pre-filled from the register, so details match before anyone starts.' },
  { icon: Fingerprint, title: 'Evidence', body: 'One identity document, with the passport chip read, a liveness check and a face match.' },
  { icon: Scale, title: 'Decide', body: 'Only an ACSP reviewer approves, asks for more or declines. AI flags, people decide.' },
  { icon: FileStack, title: 'Record', body: 'Every step kept for seven years, failed and abandoned attempts included.' },
]

export function Pillars() {
  return (
    <section aria-labelledby="pillars-title" className="bg-white pt-8 pb-24 lg:pb-32">
      <div className={container}>
        <SectionTitle id="pillars-title" className="mx-auto max-w-3xl text-center text-ink">
          Built for evidence, not shortcuts
        </SectionTitle>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <li key={p.title} className="flex min-h-[19rem] flex-col rounded-[28px] bg-[#f3f4f5] p-8">
              <span className="ml-auto flex size-14 items-center justify-center rounded-2xl bg-white text-ink">
                <p.icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-auto text-[2rem] leading-tight font-normal tracking-[-0.03em] text-ink">{p.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-graphite lg:min-h-[7.5rem]">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
