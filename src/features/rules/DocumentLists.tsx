import { useToast } from '@/components/app/Toaster'
import { Panel, PanelHeader } from '@/components/app/Page'
import { ProviderConfirmation } from '@/components/ProviderConfirmation'
import {
  CHIP_LABEL,
  DOCUMENT_LISTS,
  OPTION_1_ANY_OTHER,
} from '@/data/documentRules'
import { superAdminActor } from '@/data/rules'
import { currentRuleSet, draftRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { proposeRuleChange } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'

/*
  G2-07: the three document eligibility lists, read from the rule set. A change
  is proposed in a draft version and published by a second approver, like any
  other rule change. "Group A" and "Group B" name Option 2 lists only.
*/
export function DocumentLists({ canEdit }: { canEdit: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const current = currentRuleSet(data)
  const draft = draftRuleSet(data)
  const shown = (draft ?? current).documents
  return (
    <Panel
      id="rules-documents"
      aria-labelledby="documents-title"
      className="scroll-mt-40 overflow-hidden"
    >
      <PanelHeader
        id="documents-title"
        title="Document eligibility lists"
        description={`Option 1 reads “${OPTION_1_ANY_OTHER}”. Group A and Group B are Option 2 lists only. The lists are data in the rule set, so a Companies House change needs no redevelopment.`}
      />
      <div className="space-y-2 border-b border-line/70 px-5 py-4 sm:px-6">
        <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] text-graphite">
          <strong className="font-medium text-ink">Expired passports.</strong>{' '}
          Decided 19 October: not accepted. The client has asked the identity
          provider what it supports.
          <ProviderConfirmation />
        </p>
        <p className="text-[0.875rem] text-slate">
          Every expiry allowance below is 0 months and the setting that would
          apply one is off.
        </p>
      </div>
      <div className="divide-y divide-line/70">
        {DOCUMENT_LISTS.map((list) => (
          <section
            key={list.id}
            aria-label={list.label}
            className="px-5 py-4 sm:px-6"
          >
            <h3 className="text-base font-medium text-ink">{list.label}</h3>
            <p className="text-[0.875rem] text-slate">{list.description}</p>
            <ul className="mt-3 divide-y divide-line/60 rounded-xl border border-line/80">
              {shown
                .filter((d) => d.list === list.id)
                .map((d) => {
                  const cur = current.documents.find((x) => x.id === d.id)
                  const changed = draft && cur && cur.enabled !== d.enabled
                  return (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5"
                    >
                      <span
                        className={cn(
                          'min-w-0 flex-1 text-[0.9375rem]',
                          d.enabled ? 'text-ink' : 'text-slate line-through',
                        )}
                      >
                        {d.label}
                      </span>
                      <span className="text-[0.8125rem] text-slate">
                        {CHIP_LABEL[d.chip]} · expiry allowance{' '}
                        {d.expiryAllowanceMonths} months
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={d.enabled}
                        aria-label={`${d.label} on ${list.label}`}
                        disabled={!canEdit}
                        onClick={() => {
                          apply((s) =>
                            proposeRuleChange(
                              s,
                              {
                                kind: 'document',
                                id: d.id,
                                enabled: !d.enabled,
                              },
                              superAdminActor(1),
                            ),
                          )
                          toast({
                            title: 'Saved to the draft',
                            description: `Version ${current.version} is unchanged.`,
                          })
                        }}
                        className={cn(
                          'min-h-9 rounded-lg border px-3 py-1 text-[0.875rem] disabled:cursor-default',
                          d.enabled
                            ? 'border-approve/30 bg-approve-wash text-approve'
                            : 'border-line bg-mist text-graphite',
                          canEdit && 'cursor-pointer',
                        )}
                      >
                        {d.enabled ? 'On' : 'Off'}
                      </button>
                      {changed && (
                        <span className="w-full text-[0.8125rem] text-info">
                          Draft {draft?.version} changes this.
                        </span>
                      )}
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  )
}
