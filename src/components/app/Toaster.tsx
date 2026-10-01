import { CircleCheck, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface Toast {
  id: number
  title: string
  description?: string
}

const ToastContext = createContext<((t: Omit<Toast, 'id'>) => void) | null>(
  null,
)

/** Minimal accessible toast: announced politely, auto-dismissed, paused while hovered. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback(
    (t: Omit<Toast, 'id'>) =>
      setToasts((prev) => [
        ...prev.slice(-2),
        { ...t, id: Date.now() + Math.random() },
      ]),
    [],
  )
  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:right-6 sm:left-auto sm:items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const id = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(id)
  }, [paused, onDismiss])

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-paper shadow-[0_20px_40px_-16px_rgb(0_0_0/0.5)] [animation-duration:280ms]"
    >
      <CircleCheck
        className="mt-0.5 size-5 shrink-0 text-highlight"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[0.9375rem] text-paper/75">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="-m-1 cursor-pointer rounded-md p-1 text-paper/70 hover:text-paper"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
