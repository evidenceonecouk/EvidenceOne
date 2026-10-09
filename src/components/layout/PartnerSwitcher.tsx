import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDemoStore } from '@/store/DemoStore'

/** Shown with the Referral Partner persona: switch between Referral Partner organisations. */
export function PartnerSwitcher() {
  const { data, state, setPartner } = useDemoStore()
  const current = data.partners.find((a) => a.id === state.partnerId)
  if (state.persona !== 'partner' || !current) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 max-w-[18rem] cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 text-[0.9375rem] text-paper/90 hover:bg-white/10">
        <span className="truncate">{current.name}</span>
        <ChevronDown
          className="size-4 shrink-0 opacity-70"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="text-sm text-slate">
          Referral Partner organisation
        </DropdownMenuLabel>
        {data.partners.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => setPartner(a.id)}
            className="items-start gap-3 py-2.5"
          >
            <span className="flex-1">
              <span className="block text-base font-medium text-ink">
                {a.name}
              </span>
              <span className="block text-sm text-slate">
                {a.kind} · {a.country}. Sees status and check results only.
              </span>
            </span>
            {a.id === current.id && (
              <Check className="mt-0.5 size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
