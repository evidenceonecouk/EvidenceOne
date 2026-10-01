import { PersonaSwitcher } from './PersonaSwitcher'
import { ResetDemoButton } from './ResetDemoButton'

/*
  Demo controls live in their own slim dark bar, separate from the product's
  header, so the product screens stay clean for an audience.
*/
export function PresenterBar() {
  return (
    <div className="on-dark sticky top-0 z-40 h-14 bg-ink text-paper print:hidden">
      <div className="mx-auto flex h-full max-w-[88rem] items-center gap-3 px-4 sm:px-6">
        <span className="hidden text-sm font-medium tracking-wide text-paper/70 uppercase xl:inline">
          Demo view
        </span>
        <PersonaSwitcher />
        <div className="ml-auto flex items-center gap-1">
          <ResetDemoButton />
        </div>
      </div>
    </div>
  )
}
