import { Check, MessageSquareText } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Checkbox } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* Form primitives for the onboarding journeys: real labels, 16px text, visible focus. */

const inputClass =
  'mt-2 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10'

export function Field({
  label,
  hint,
  children,
  id,
}: {
  label: string
  hint?: string
  children: (id: string) => ReactNode
  id?: string
}) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div>
      <label htmlFor={fid} className="text-base font-medium text-ink">
        {label}
      </label>
      {hint && <p className="text-base text-slate">{hint}</p>}
      {children(fid)}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  type = 'text',
  inputMode,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  hint?: string
  type?: string
  inputMode?: 'numeric' | 'tel' | 'email' | 'text'
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <TextField
      label={label}
      hint={hint}
      inputMode="numeric"
      value={value}
      onChange={(v) => onChange(Number(v.replace(/\D/g, '')) || 0)}
    />
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={inputClass}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function CheckField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3.5 py-1.5">
      <Checkbox
        className="mt-0.5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-base leading-relaxed text-ink">
        {label}
        {hint && <span className="block text-slate">{hint}</span>}
      </span>
    </label>
  )
}

/** A group of tick boxes bound to a list of values. */
export function CheckGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  hint,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T[]
  onChange: (v: T[]) => void
  hint?: string
}) {
  return (
    <fieldset>
      <legend className="text-base font-medium text-ink">{legend}</legend>
      {hint && <p className="text-base text-slate">{hint}</p>}
      <div className="mt-1 grid gap-x-6 sm:grid-cols-2">
        {options.map((o) => (
          <CheckField
            key={o.value}
            label={o.label}
            checked={value.includes(o.value)}
            onChange={(on) =>
              onChange(
                on ? [...value, o.value] : value.filter((x) => x !== o.value),
              )
            }
          />
        ))}
      </div>
    </fieldset>
  )
}

export function RadioGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  name,
}: {
  legend: string
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  name: string
}) {
  return (
    <fieldset>
      <legend className="text-base font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid gap-3">
        {options.map((o) => {
          const on = o.value === value
          return (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
                on ? 'border-ink bg-mist/60' : 'border-line bg-white',
              )}
            >
              <input
                type="radio"
                name={name}
                checked={on}
                onChange={() => onChange(o.value)}
                className="mt-1 size-5 accent-[var(--ink)]"
              />
              <span>
                <span className="block text-base font-medium text-ink">
                  {o.label}
                </span>
                {o.hint && (
                  <span className="block text-base text-slate">{o.hint}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Simulated mobile confirmation by one-time code. Any six digits work in the demo. */
export function MobileConfirm({
  mobile,
  confirmed,
  onConfirmed,
  who,
}: {
  mobile: string
  confirmed: boolean
  onConfirmed: () => void
  who: string
}) {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const id = useId()
  if (confirmed)
    return (
      <p className="flex items-center gap-2 text-base font-medium text-approve">
        <Check className="size-5" aria-hidden="true" />
        Mobile number confirmed
      </p>
    )
  return (
    <div className="flex flex-wrap items-end gap-3">
      {!sent ? (
        <Button
          type="button"
          variant="outline"
          disabled={mobile.trim().length < 8}
          onClick={() => setSent(true)}
          aria-label={`Send a one-time code to ${who}`}
        >
          <MessageSquareText aria-hidden="true" />
          Send a one-time code
        </Button>
      ) : (
        <>
          <div>
            <label htmlFor={id} className="text-base font-medium text-ink">
              Code sent to {mobile}
            </label>
            <input
              id={id}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-2 block h-12 w-40 rounded-xl border border-line bg-white px-3.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
          </div>
          <Button
            type="button"
            disabled={code.length !== 6}
            onClick={onConfirmed}
          >
            Confirm
          </Button>
          <p className="basis-full text-base text-slate">
            Any six digits work in this demonstration.
          </p>
        </>
      )}
    </div>
  )
}

export function Subsection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-4 border-t border-line/70 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      {children}
    </div>
  )
}
