import { ClipboardList, Compass, Play, Square } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GuidedDemo } from '@/features/guided/GuidedDemo'
import { guidedSteps } from '@/features/guided/steps'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { PersonaSwitcher } from './PersonaSwitcher'
import { ResetDemoButton } from './ResetDemoButton'

/** Guided demo menu: start or stop, and the presenter-only Decisions and open points page. */
function GuidedMenu() {
  const { state, setGuided, setShowHeldOptions } = useDemoStore()
  const showHeld = state.showHeldOptions !== false
  const navigate = useNavigate()
  const on = state.guided.on
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[0.9375rem] font-medium',
          on
            ? 'bg-paper text-ink'
            : 'text-paper/85 hover:bg-white/10 hover:text-paper',
        )}
        aria-label={`Guided demo, ${guidedSteps.length} steps, currently ${on ? 'on' : 'off'}`}
      >
        <Compass className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          Guided demo, {guidedSteps.length} steps
        </span>
        <span className="hidden text-[0.8125rem] sm:inline">
          {on ? 'On' : 'Off'}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {on ? (
          <DropdownMenuItem
            onSelect={() => setGuided({ on: false, step: state.guided.step })}
            className="gap-2 py-2.5 text-base"
          >
            <Square className="size-4" aria-hidden="true" />
            Stop the guided demo
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => setGuided({ on: true, step: 0 })}
            className="gap-2 py-2.5 text-base"
          >
            <Play className="size-4" aria-hidden="true" />
            Start the guided demo
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => navigate('/decisions')}
          className="gap-2 py-2.5 text-base"
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          Decisions and open points
          <span className="ml-auto text-sm text-slate">Presenter only</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showHeld}
          onCheckedChange={(v) => setShowHeldOptions(v === true)}
          onSelect={(e) => e.preventDefault()}
          className="py-2.5 text-base"
        >
          <span>
            Show options held until after go-live
            <span className="block text-sm text-slate">
              Language help, Route B filings, bank statement redaction
            </span>
          </span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
  Demo controls live in their own slim dark bar, separate from the product's
  header, so the product screens stay clean for an audience.
*/
export function PresenterBar() {
  return (
    <>
      <div className="on-dark sticky top-0 z-40 h-14 bg-ink text-paper print:hidden">
        <div className="mx-auto flex h-full max-w-[88rem] items-center gap-3 px-4 sm:px-6">
          <span className="hidden whitespace-nowrap text-sm font-medium tracking-wide text-paper/70 uppercase min-[1800px]:inline">
            Demo view
          </span>
          <PersonaSwitcher />
          <div className="ml-auto flex items-center gap-1">
            <GuidedMenu />
            <ResetDemoButton />
          </div>
        </div>
      </div>
      <GuidedDemo />
    </>
  )
}
