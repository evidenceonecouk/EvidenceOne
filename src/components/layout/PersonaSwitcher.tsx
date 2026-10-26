import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { personaById, personas } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'

/** Lets a presenter switch between the viewpoints without logging in and out. */
export function PersonaSwitcher({ onChoose }: { onChoose?: () => void }) {
  const { state, setPersona } = useDemoStore()
  const navigate = useNavigate()

  const choose = (id: PersonaId) => {
    setPersona(id)
    navigate(personaById(id).home)
    onChoose?.()
  }

  return (
    <fieldset>
      <legend className="sr-only">Show the demo as</legend>
      <div className="grid grid-cols-2 gap-2">
        {personas.map((p) => {
          const Icon = p.icon
          const active = p.id === state.persona
          return (
            <label
              key={p.id}
              title={p.description}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-xl border p-2.5 transition-colors duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink/30',
                active
                  ? 'border-ink bg-mist'
                  : 'border-line bg-white hover:border-slate hover:bg-mist/60',
              )}
            >
              <input
                type="radio"
                name="demo-persona"
                value={p.id}
                checked={active}
                onChange={() => choose(p.id)}
                className="sr-only"
              />
              <span className="flex items-center justify-between">
                <Icon
                  className={cn('size-4', active ? 'text-ink' : 'text-slate')}
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-[1.125rem] items-center justify-center rounded-full border-2',
                    active ? 'border-ink' : 'border-slate/60',
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-ink" />}
                </span>
              </span>
              <span className="mt-1.5 text-[0.9375rem] leading-tight font-medium text-ink">
                {p.label}
              </span>
              <span className="mt-0.5 text-[0.8125rem] leading-snug text-slate short:hidden">
                {p.hint}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
