import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export interface PlaceholderSpec {
  eyebrow: string
  title: string
  summary: string
  planned: string[]
}

/** Stands in for a screen that arrives in a later build, so every route resolves cleanly. */
export function ScreenPlaceholder({ spec }: { spec: PlaceholderSpec }) {
  return (
    <div className="mx-auto max-w-[88rem] px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-[0.9375rem] font-medium tracking-wide text-slate uppercase">{spec.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-normal tracking-[-0.03em] text-ink sm:text-5xl">{spec.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite">{spec.summary}</p>

      <div className="mt-10 max-w-2xl rounded-3xl border border-dashed border-silver bg-paper/70 p-7">
        <p className="flex items-center gap-2 text-base font-medium text-ink">
          <Construction className="size-5" aria-hidden="true" />
          This screen is being built
        </p>
        <ul className="mt-4 space-y-2 text-base text-graphite">
          {spec.planned.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button asChild variant="outline" className="mt-8">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Back to the start
        </Link>
      </Button>
    </div>
  )
}
