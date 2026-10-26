import {
  Briefcase,
  Building2,
  Fingerprint,
  KeyRound,
  Landmark,
  Loader2,
  Settings2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/store/DemoStore'
import { personaById } from '@/store/personas'
import type { PersonaId } from '@/types/domain'

const workspaces: {
  id: PersonaId
  label: string
  detail: string
  icon: typeof Briefcase
}[] = [
  {
    id: 'partner',
    label: 'Referral Partner',
    detail: 'Fenwick & Shaw Chartered Accountants',
    icon: Briefcase,
  },
  {
    id: 'reviewer',
    label: 'ACSP',
    detail: 'Harcourt Lane Solicitors LLP · ACSP Reviewer',
    icon: Building2,
  },
  {
    id: 'platformAdmin',
    label: 'Platform Administrator',
    detail: 'Evidence One platform · approvals, allocation and monitoring',
    icon: Settings2,
  },
  {
    id: 'superAdmin',
    label: 'Super Administrator',
    detail:
      'Evidence One platform · fees, commissions and rules, with a second approver',
    icon: UserCheck,
  },
]

const trust = [
  {
    icon: Fingerprint,
    title: 'Passkey or authenticator app',
    detail: 'No passwords and no SMS codes for professionals.',
  },
  {
    icon: ShieldCheck,
    title: 'Confirm it’s you on every decision',
    detail: 'Approve, decline and export each ask for step-up.',
  },
  {
    icon: Landmark,
    title: 'Your One Login stays yours',
    detail:
      'Evidence One never asks for, stores or uses GOV.UK One Login details. It is never a way to sign in here.',
  },
]

/** Professional sign-in: a passkey or an authenticator app. Both are simulated. */
export function SignIn() {
  const { setPersona } = useDemoStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('eleanor.marsh@harcourtlane.example')
  const [stage, setStage] = useState<'email' | 'passkey' | 'code' | 'done'>(
    'email',
  )
  const [code, setCode] = useState('')

  const passkey = () => {
    setStage('passkey')
    window.setTimeout(() => setStage('done'), 1100)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[60rem] items-center px-4 py-8 sm:px-8">
      <div className="stagger grid w-full overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(22_24_27/0.35)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <aside className="flex flex-col justify-between gap-8 bg-ink px-7 py-8 text-paper sm:px-9 sm:py-10">
          <div className="flex justify-center md:justify-start">
            <Wordmark inverted size="lg" align="center" />
          </div>
          <ul className="space-y-4">
            {trust.map((t) => (
              <li key={t.title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper/10">
                  <t.icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-medium text-paper">
                    {t.title}
                  </span>
                  <span className="block text-[0.9375rem] leading-snug text-paper/70">
                    {t.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="hidden text-[0.875rem] text-paper/60 md:block">
            The ACSP verifies. Evidence One is its technology provider.
          </p>
        </aside>
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {stage !== 'done' ? (
            <>
              <h1 className="text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-ink">
                Sign in for professionals
              </h1>
              <p className="mt-2 text-base text-graphite">
                For Referral Partners, ACSPs and platform staff. Sign in with a
                passkey or your authenticator app.
              </p>
              <label
                htmlFor="signin-email"
                className="mt-6 block text-[0.9375rem] font-medium text-ink"
              >
                Work email
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="username webauthn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
              <Button
                size="lg"
                className="mt-5 w-full disabled:opacity-100"
                disabled={!email.includes('@') || stage === 'passkey'}
                onClick={passkey}
              >
                {stage === 'passkey' ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Fingerprint aria-hidden="true" />
                )}
                {stage === 'passkey'
                  ? 'Waiting for your passkey'
                  : 'Sign in with a passkey'}
              </Button>
              {stage === 'code' ? (
                <div className="mt-5">
                  <label
                    htmlFor="signin-code"
                    className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink"
                  >
                    <KeyRound className="size-4" aria-hidden="true" />
                    Code from your authenticator app
                  </label>
                  <div className="mt-2 flex gap-3">
                    <input
                      id="signin-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      className="h-12 w-40 rounded-xl border border-line bg-white px-3.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                    />
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={code.length !== 6}
                      onClick={() => setStage('done')}
                    >
                      Sign in
                    </Button>
                  </div>
                  <p className="mt-1.5 text-sm text-slate">
                    Any six digits work in this demonstration.
                  </p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-3 w-full"
                  disabled={stage === 'passkey'}
                  onClick={() => setStage('code')}
                >
                  <KeyRound aria-hidden="true" />
                  Use my authenticator app
                </Button>
              )}
              <p className="mt-6 border-t border-line/80 pt-4 text-[0.9375rem] text-slate">
                Directors and PSCs sign in in the browser with a one-time code
                or a passkey.
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2.5 text-lg font-medium text-ink">
                <CompletionTick className="size-6" label="Signed in" />
                Signed in
              </p>
              <p className="mt-2 text-base text-graphite">
                Choose where to go. In this demonstration you can open any
                workspace.
              </p>
              <ul className="mt-5 space-y-2.5">
                {workspaces.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPersona(w.id)
                        navigate(personaById(w.id).home)
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-left hover:border-silver hover:bg-mist/50"
                    >
                      <span className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink">
                        <w.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-base font-medium text-ink">
                          {w.label}
                        </span>
                        <span className="block text-[0.9375rem] text-slate">
                          {w.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
