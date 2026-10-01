import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@/components/app/Page'
import { cn } from '@/lib/utils'

/** One pack field: the value, a copy button and a "done" tick the reviewer sets once it is entered. */
export function CopyRow({
  label,
  value,
  done,
  onToggle,
  disabled,
}: {
  label: string
  value: string
  done?: boolean
  onToggle?: () => void
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard can be blocked; the visual confirmation still helps the presenter.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:px-6',
        done && 'bg-approve-wash/30',
      )}
    >
      <dt className="col-span-2 text-[0.9375rem] text-slate sm:col-span-1">
        {label}
      </dt>
      <dd className="min-w-0 text-base break-words text-ink">{value}</dd>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className={cn(
            'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[0.875rem] transition-colors duration-150',
            copied
              ? 'border-approve/30 bg-approve-wash text-approve'
              : 'border-line bg-white text-ink hover:bg-mist',
          )}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
        {onToggle && (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-[0.875rem] text-graphite">
            <Checkbox
              checked={!!done}
              onChange={onToggle}
              disabled={disabled}
              aria-label={`Mark ${label} as done`}
            />
            <span className="hidden md:inline">Done</span>
          </label>
        )}
      </div>
    </div>
  )
}
