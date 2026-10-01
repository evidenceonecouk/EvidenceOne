import { Check, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { personaById, personas } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'

/** Lets a presenter switch between the five viewpoints without logging in and out. */
export function PersonaSwitcher() {
  const { state, setPersona } = useDemoStore()
  const navigate = useNavigate()

  const choose = (id: PersonaId) => {
    setPersona(id)
    navigate(personaById(id).home)
  }

  const current = personaById(state.persona)

  return (
    <>
      {/* Wide screens: every persona visible at once */}
      <div role="group" aria-label="View the demo as" className="hidden items-center gap-1 rounded-xl bg-white/[0.06] p-1 xl:flex">
        {personas.map((p) => {
          const Icon = p.icon
          const active = p.id === state.persona
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => choose(p.id)}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors duration-150',
                active ? 'bg-paper text-ink shadow-sm' : 'text-paper/80 hover:bg-white/10 hover:text-paper',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="2xl:hidden">{p.id === 'admin2' ? p.shortLabel : p.label}</span>
              <span className="hidden 2xl:inline">{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Narrow screens: a menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-white/[0.08] px-3.5 text-[0.9375rem] font-medium text-paper hover:bg-white/15 xl:hidden"
          aria-label={`Viewing as ${current.label}. Change persona`}
        >
          <current.icon className="size-4" aria-hidden="true" />
          {current.label}
          <ChevronDown className="size-4 opacity-70" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-sm text-slate">View the demo as</DropdownMenuLabel>
          {personas.map((p) => (
            <DropdownMenuItem key={p.id} onSelect={() => choose(p.id)} className="items-start gap-3 py-2.5">
              <p.icon className="mt-0.5 size-4" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-base font-medium text-ink">{p.label}</span>
                <span className="block text-sm leading-snug text-slate">{p.description}</span>
              </span>
              {p.id === state.persona && <Check className="mt-0.5 size-4" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
