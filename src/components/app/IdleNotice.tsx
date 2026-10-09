import { Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const WARNING_SECONDS = 60

/**
  Shown one minute before an idle session ends: 15 minutes for professionals,
  30 for individuals. Focus moves to "Stay signed in" and returns afterwards.
  Wired to the guided demo only.
*/
export function IdleNotice({
  kind,
  open,
  onStay,
  onSignOut,
}: {
  kind: 'professional' | 'individual'
  open: boolean
  onStay: () => void
  onSignOut: () => void
}) {
  const [left, setLeft] = useState(WARNING_SECONDS)
  const stayRef = useRef<HTMLButtonElement>(null)
  const signOutRef = useRef<HTMLButtonElement>(null)
  const signOutCb = useRef(onSignOut)
  signOutCb.current = onSignOut

  useEffect(() => {
    if (!open) return
    setLeft(WARNING_SECONDS)
    const previous = document.activeElement as HTMLElement | null
    stayRef.current?.focus()
    const timer = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer)
          signOutCb.current()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      window.clearInterval(timer)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  const minutes = kind === 'professional' ? 15 : 30

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onStay()
    if (e.key === 'Tab') {
      const first = stayRef.current
      const last = signOutRef.current
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        aria-describedby="idle-desc"
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-lg"
      >
        <h2
          id="idle-title"
          className="flex items-center gap-2 text-xl font-medium text-ink"
        >
          <Clock className="size-5" aria-hidden="true" />
          You will be signed out in 1 minute
        </h2>
        <p id="idle-desc" className="mt-3 text-base text-graphite">
          For your security, a {kind} session ends after {minutes} minutes
          without activity. Choose Stay signed in to carry on where you were.
        </p>
        <p
          className="mt-4 font-mono text-3xl tracking-tight text-ink tabular"
          aria-hidden="true"
        >
          0:{String(left).padStart(2, '0')}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button ref={stayRef} size="lg" onClick={onStay}>
            Stay signed in
          </Button>
          <Button
            ref={signOutRef}
            size="lg"
            variant="outline"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
