import { useMemo } from 'react'
import {
  Bot,
  Check,
  Fingerprint,
  KeyRound,
  Minus,
  ShieldCheck,
} from 'lucide-react'
import { Page, Panel, PanelHeader } from '@/components/app/Page'
import { Avatar } from '@/components/visual/Avatar'
import { buildUsers, capabilities, roles } from '@/data/adminPages'
import { formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { AdminHeader, Figure, StateBadge } from './kit'

export function UsersRolesPage() {
  const { state } = useDemoStore()
  const users = useMemo(
    () => buildUsers(new Date(state.seededAt).getTime() + 2 * 3_600_000),
    [state.seededAt],
  )
  const people = users.filter((u) => !u.service)
  const passkeys = people.filter((u) => u.factor.startsWith('Passkey')).length
  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label ?? id
  const canDecide = (id: string) =>
    capabilities
      .find((c) => c.label === 'Approve or decline')!
      .grants.includes(id as never)

  return (
    <Page>
      <AdminHeader
        title="Users and roles"
        description="Who can do what. People sign in with a passkey or an authenticator app, and confirm it is them again before every approval, decline and export. The AI is a service account with fewer permissions than any person."
      />

      <Panel aria-label="Access summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <Figure
            label="People"
            value={people.length}
            detail={`Across ${new Set(people.map((u) => u.org)).size} organisations`}
          />
          <Figure
            label="Using a passkey"
            value={`${Math.round((passkeys / people.length) * 100)}%`}
            detail="The rest use an authenticator app"
          />
          <Figure
            label="Can approve"
            value={people.filter((u) => canDecide(u.role)).length}
            detail="Always with step-up"
          />
          <Figure
            label="Service accounts"
            value={users.length - people.length}
            detail="Cannot approve or change a case"
          />
        </dl>
      </Panel>

      <Panel aria-labelledby="users-title" className="mb-6 overflow-hidden">
        <PanelHeader
          id="users-title"
          title="Users"
          description="People and service accounts"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                <th
                  scope="col"
                  className="py-2.5 pr-4 pl-5 font-normal sm:pl-6"
                >
                  User
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Role
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Can approve
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Sign-in
                </th>
                <th scope="col" className="py-2.5 pr-6 font-normal">
                  Last active
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    'border-t border-line/70',
                    u.service && 'bg-ai-wash/40',
                  )}
                >
                  <td className="py-3.5 pr-4 pl-5 sm:pl-6">
                    <div className="flex items-center gap-3">
                      {u.service ? (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist text-ink ring-1 ring-line">
                          <Bot className="size-[1.125rem]" aria-hidden="true" />
                        </span>
                      ) : (
                        <Avatar seed={u.id} name={u.name} size={36} />
                      )}
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-medium text-ink">
                          {u.name}
                        </span>
                        <span className="block text-[0.875rem] text-slate">
                          {u.org}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[0.9375rem] text-ink">
                    {roleLabel(u.role)}
                  </td>
                  <td className="py-3.5 pr-4">
                    {canDecide(u.role) ? (
                      <StateBadge tone="ok">Yes, with step-up</StateBadge>
                    ) : (
                      <StateBadge tone="neutral" icon={Minus}>
                        No
                      </StateBadge>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-[0.9375rem] text-graphite">
                    <span className="inline-flex items-center gap-1.5">
                      {u.factor.startsWith('Passkey') ? (
                        <Fingerprint
                          className="size-4 text-slate"
                          aria-hidden="true"
                        />
                      ) : u.service ? null : (
                        <KeyRound
                          className="size-4 text-slate"
                          aria-hidden="true"
                        />
                      )}
                      {u.service ? 'Scoped service credentials' : u.factor}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6 text-[0.9375rem] text-slate">
                    <time
                      dateTime={u.lastSeen}
                      title={formatDateTime(u.lastSeen)}
                    >
                      {timeAgo(u.lastSeen)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel aria-labelledby="matrix-title" className="overflow-hidden">
        <PanelHeader
          id="matrix-title"
          title="Permissions"
          description="What each role can do. Enforced by the platform, not by policy alone."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[72rem] text-left">
            <thead>
              <tr className="border-b border-line/70">
                <th
                  scope="col"
                  className="w-[17rem] min-w-[17rem] py-3 pr-4 pl-5 text-[0.875rem] font-normal text-slate sm:pl-6"
                >
                  Capability
                </th>
                {roles.map((r) => (
                  <th
                    key={r.id}
                    scope="col"
                    className={cn(
                      'w-[8.5rem] px-2 py-3 text-center align-bottom',
                      r.service && 'bg-ai-wash/50',
                    )}
                  >
                    <span className="block text-[0.875rem] leading-tight font-medium text-ink">
                      {r.label}
                    </span>
                    <span className="mt-1 block text-[0.75rem] leading-tight font-normal text-slate">
                      {r.service ? 'Service account' : 'Person'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((c) => (
                <tr key={c.label} className="border-t border-line/70">
                  <th
                    scope="row"
                    className="py-3 pr-4 pl-5 text-left font-normal sm:pl-6"
                  >
                    <span className="block text-[0.9375rem] text-ink">
                      {c.label}
                    </span>
                    {c.note && (
                      <span className="block text-[0.8125rem] text-slate">
                        {c.note}
                      </span>
                    )}
                  </th>
                  {roles.map((r) => {
                    const yes = c.grants.includes(r.id)
                    return (
                      <td
                        key={r.id}
                        className={cn(
                          'px-2 py-3 text-center',
                          r.service && 'bg-ai-wash/30',
                        )}
                      >
                        {yes ? (
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-paper">
                            <Check
                              className="size-4"
                              strokeWidth={2.5}
                              aria-label="Allowed"
                            />
                          </span>
                        ) : (
                          <span className="inline-flex size-7 items-center justify-center text-silver">
                            <Minus
                              className="size-4"
                              aria-label="Not allowed"
                            />
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-2 border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-slate"
            aria-hidden="true"
          />
          The AI cannot approve, change a case or edit the audit trail because
          its account holds no such permission. GOV.UK One Login is used only by
          the ACSP when submitting to Companies House, never to sign in to
          Evidence One.
        </p>
      </Panel>
    </Page>
  )
}
