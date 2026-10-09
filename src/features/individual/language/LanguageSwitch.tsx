import { Check, ChevronDown, Languages } from 'lucide-react'
import { useState } from 'react'
import { languageByCode, languages } from '@/data/i18n'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'

/**
  Language switch for every individual-facing screen: a compact menu button
  that shows the current language. Writes state.language. English stays the
  version of record.
*/
export function LanguageSwitch({ className }: { className?: string }) {
  const { state, setLanguage } = useDemoStore()
  const [open, setOpen] = useState(false)
  const current = languageByCode(state.language)
  return (
    <div
      className={cn('relative', className)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}. Change language`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[0.9375rem] text-ink hover:bg-mist focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Languages className="size-4" aria-hidden="true" />
        <span>{current.label.replace(' (Simplified)', '')}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute end-0 top-full z-50 mt-1 w-56 rounded-xl border border-line bg-white p-1 shadow-lg"
        >
          {languages.map((l) => (
            <li
              key={l.code}
              role="option"
              aria-selected={l.code === state.language}
            >
              <button
                type="button"
                lang={l.code}
                onClick={() => {
                  setLanguage(l.code)
                  setOpen(false)
                }}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-start text-base text-ink hover:bg-mist focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
              >
                <span>
                  {l.native}
                  {l.native !== l.label && (
                    <span className="ms-2 text-[0.875rem] text-slate">
                      {l.label}
                    </span>
                  )}
                </span>
                {l.code === state.language && (
                  <Check className="size-4" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
