import { useState } from 'react'
import { Check, CircleAlert, Globe, Lock, Paintbrush } from 'lucide-react'
import { Page, Panel, PanelHeader } from '@/components/app/Page'
import { deployments, partnerCan, staysFixed, type Deployment } from '@/data/adminPages'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp } from '@/store/selectors'
import { AdminHeader, StateBadge } from './kit'

const stateTone = { live: 'ok', configuring: 'attention', planned: 'neutral' } as const
const stateLabel = { live: 'Live', configuring: 'Configuring', planned: 'Planned' } as const

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

export function WhiteLabelPage() {
  const { data } = useDemoStore()
  const acsp = getAcsp(data, PRIMARY_ACSP_ID)!
  const [selected, setSelected] = useState<Deployment['id']>('fenwick')
  const [colours, setColours] = useState<Record<string, string>>(() => Object.fromEntries(deployments.map((d) => [d.id, d.brand])))
  const dep = deployments.find((d) => d.id === selected)!
  const brand = colours[dep.id]
  const onWhite = contrast(brand, '#ffffff')
  const onInk = contrast(brand, '#16181b')
  const textOnBrand = onWhite >= onInk ? '#ffffff' : '#16181b'
  const textRatio = Math.max(onWhite, onInk)

  return (
    <Page>
      <AdminHeader title="White label" description="A partner can put its own brand on the journey people see. The regulated parts do not move: the ACSP named, the rules, the decision and the record are the same on every deployment." />

      <Panel aria-labelledby="dep-title" className="mb-6 overflow-hidden">
        <PanelHeader id="dep-title" title="Deployments" description="Select one to preview and adjust its brand" />
        <ul className="divide-y divide-line/70" role="radiogroup" aria-label="Deployment">
          {deployments.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected === d.id}
                onClick={() => setSelected(d.id)}
                className={cn('flex w-full cursor-pointer flex-wrap items-center gap-4 px-5 py-4 text-left transition-colors duration-150 focus-visible:bg-mist/60 focus-visible:outline-none sm:flex-nowrap sm:px-6', selected === d.id ? 'bg-mist/60' : 'hover:bg-mist/40')}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[0.9375rem] font-medium shadow-inner" style={{ background: colours[d.id], color: contrast(colours[d.id], '#ffffff') >= contrast(colours[d.id], '#16181b') ? '#fff' : '#16181b' }} aria-hidden="true">
                  {d.name
                    .split(' ')
                    .filter((w) => /^[A-Z]/.test(w))
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">{d.name}</span>
                  <span className="block text-[0.875rem] text-slate">{d.note}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.875rem] text-graphite">
                  <Globe className="size-4 text-slate" aria-hidden="true" />
                  {d.address}
                </span>
                <span className="w-28 text-right text-[0.875rem] text-slate tabular">{d.journeys ? `${d.journeys.toLocaleString('en-GB')} journeys` : 'No journeys yet'}</span>
                <StateBadge tone={stateTone[d.state]}>{stateLabel[d.state]}</StateBadge>
                <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border-2', selected === d.id ? 'border-ink bg-ink text-paper' : 'border-line')} aria-hidden="true">
                  {selected === d.id && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Panel aria-labelledby="brand-title" className="overflow-hidden">
            <PanelHeader id="brand-title" title="Brand colour" description={dep.name} actions={<Paintbrush className="size-5 text-slate" aria-hidden="true" />} />
            <div className="space-y-4 p-5 sm:p-6">
              <label className="flex items-center gap-4">
                <input type="color" value={brand} onChange={(e) => setColours((c) => ({ ...c, [dep.id]: e.target.value }))} className="size-14 cursor-pointer rounded-xl border border-line bg-white p-1" />
                <span>
                  <span className="block text-[0.9375rem] font-medium text-ink">Choose a colour</span>
                  <span className="block font-mono text-[0.875rem] text-slate uppercase">{brand}</span>
                </span>
              </label>
              <p className={cn('flex items-start gap-2 rounded-xl px-4 py-3 text-[0.9375rem]', textRatio >= 4.5 ? 'bg-approve-wash text-approve' : 'bg-info-wash text-info')} aria-live="polite">
                {textRatio >= 4.5 ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                <span>
                  {textRatio >= 4.5
                    ? `Text on this colour reaches ${textRatio.toFixed(1)}:1, which meets WCAG 2.2 AA. ${textOnBrand === '#ffffff' ? 'White' : 'Dark'} text is used automatically.`
                    : `Text on this colour only reaches ${textRatio.toFixed(1)}:1. It would fail WCAG 2.2 AA, so the journey keeps its buttons in graphite.`}
                </span>
              </p>
            </div>
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Panel aria-labelledby="can-title" className="overflow-hidden">
              <PanelHeader id="can-title" title="What a partner can change" />
              <ul className="space-y-2.5 p-5 sm:p-6">
                {partnerCan.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[0.9375rem] text-ink">
                    <Check className="size-4 shrink-0 text-approve" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel aria-labelledby="fixed-title" className="overflow-hidden bg-ink text-paper">
              <div className="border-b border-white/12 px-5 py-4 sm:px-6">
                <h2 id="fixed-title" className="text-[1.0625rem] font-medium">What stays with the ACSP</h2>
              </div>
              <ul className="space-y-2.5 p-5 sm:p-6">
                {staysFixed.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[0.9375rem] text-paper/90">
                    <Lock className="size-4 shrink-0 text-highlight" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <Panel aria-labelledby="preview-title" className="overflow-hidden xl:sticky xl:top-20">
          <PanelHeader id="preview-title" title="Preview" description={`What a director sees at ${dep.address}`} />
          <div className="bg-[radial-gradient(circle_at_30%_0%,#ffffff,#eceeef)] p-5 sm:p-8">
            <div className="mx-auto max-w-[24rem] overflow-hidden rounded-[2rem] border-[6px] border-ink bg-white shadow-[0_30px_60px_-30px_rgb(22_24_27/0.6)]">
              <div className="px-5 pt-5 pb-6 transition-colors duration-300" style={{ background: brand, color: textOnBrand }}>
                <p className="text-[0.8125rem] opacity-80">{dep.address}</p>
                <p className="mt-3 text-[1.375rem] leading-tight font-medium">{dep.name}</p>
                <p className="mt-1 text-[0.9375rem] opacity-90">Verify your identity for Companies House</p>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-base text-ink">Hello Daniel. Lumenfield Analytics Ltd lists you as a director. It takes about eight minutes.</p>
                <div className="rounded-xl border border-dashed border-silver bg-mist/50 p-3.5">
                  <p className="flex items-center gap-1.5 font-mono text-[0.75rem] tracking-[0.1em] text-slate uppercase">
                    <Lock className="size-3" aria-hidden="true" />
                    Fixed wording
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink">
                    Your identity verification is being conducted by {acsp.name} using the Evidence One platform.
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-12 w-full items-center justify-center rounded-xl text-base font-medium transition-colors duration-300"
                  style={textRatio >= 4.5 ? { background: brand, color: textOnBrand } : { background: '#16181b', color: '#fafaf9' }}
                >
                  Start
                </div>
                <p className="text-center text-[0.8125rem] text-slate">{dep.id === 'default' ? 'Fee £49 · Pay yourself or use a payment code' : `Fee £49 · Paid by ${dep.name}`}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </Page>
  )
}
