import { ArrowRight, CircleCheck, FileText, Gauge, MessageSquare, ScanFace, Settings, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/visual/Avatar'
import { useDemoStore } from '@/store/DemoStore'
import { container } from '../parts'
import { RuleKicker } from './Hero'

const activity = [
  ['Client verification completed', 'Today, 10:24'],
  ['Personal code recorded', 'Today, 09:41'],
  ['Register correction filed', 'Yesterday, 16:03'],
  ['Director invited from the register', 'Yesterday, 14:18'],
]

function LaptopDashboard() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[40rem]">
      <div className="rounded-t-[22px] border-[10px] border-b-0 border-[#1a1b1d] bg-[#1a1b1d] shadow-[0_40px_80px_-40px_rgb(22_24_27/0.6)]">
        <div className="flex aspect-[16/10] overflow-hidden rounded-t-[10px] bg-white text-ink">
          <aside className="w-[24%] shrink-0 border-r border-line bg-[#f7f8f8] p-3">
            <Wordmark tagline={false} className="[&>span]:text-[0.9375rem]" />
            <ul className="mt-4 space-y-1 text-[0.6875rem]">
              {[
                [Gauge, 'Dashboard'],
                [Users, 'Clients'],
                [ScanFace, 'Verifications'],
                [FileText, 'Filings'],
                [MessageSquare, 'Messages'],
                [Settings, 'Settings'],
              ].map(([Icon, label], i) => {
                const I = Icon as typeof Gauge
                return (
                  <li key={label as string} className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 ${i === 0 ? 'bg-highlight font-medium' : 'text-graphite'}`}>
                    <I className="size-3" />
                    {label as string}
                  </li>
                )
              })}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.875rem] font-medium">Welcome</p>
                <p className="text-[0.625rem] text-slate">Your overview</p>
              </div>
              <span className="flex items-center gap-1.5 text-[0.625rem]">
                <Avatar seed="rev-marsh" name="Eleanor Marsh" size={20} />
                Eleanor Marsh · ACSP
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ['12', 'Verifications in progress'],
                ['8', 'Codes recorded this month'],
                ['15', 'Filings completed this month'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-lg border border-line p-2">
                  <p className="text-[1.125rem] leading-none font-light">{n}</p>
                  <p className="mt-1 text-[0.5625rem] leading-tight text-slate">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.6875rem] font-medium">Recent activity</p>
            <ul className="mt-1.5 divide-y divide-line/70 rounded-lg border border-line">
              {activity.map(([t, d]) => (
                <li key={t} className="flex items-center gap-1.5 px-2 py-1.5 text-[0.625rem]">
                  <CircleCheck className="size-3 text-approve" />
                  <span className="flex-1 truncate">{t}</span>
                  <span className="text-slate">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="relative mx-[-6%] h-4 rounded-b-[14px] bg-[linear-gradient(180deg,#d4d6d8,#a9adb1)] shadow-[0_12px_24px_-12px_rgb(22_24_27/0.5)]">
        <span className="absolute top-0 left-1/2 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-[#8f9397]" />
      </div>
    </div>
  )
}

export function Forward() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="forward-title" className="overflow-hidden bg-[#f4f4f3] py-24">
      <div className={`${container} grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]`}>
        <div>
          <RuleKicker>A simpler way forward</RuleKicker>
          <h2 id="forward-title" className="mt-6 text-[2.5rem] leading-[1.05] font-normal tracking-[-0.04em] text-ink sm:text-[3.25rem]">
            Connecting businesses, ACSPs and Companies House.
          </h2>
          <p className="mt-4 text-[1.5rem] tracking-[-0.02em] text-[#6d7279]">Less complexity. More progress.</p>
          <Button asChild size="lg" className="mt-9 h-14 rounded-full bg-highlight px-9 text-lg text-ink hover:bg-[#ffcf26]">
            <Link to="/agent" onClick={() => setPersona('agent')}>
              Get started
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <LaptopDashboard />
      </div>
    </section>
  )
}

const footerNav: [string, string][] = [
  ['For ACSPs', '#for-acsps'],
  ['For partners', '#for-partners'],
  ['How it works', '#how-it-works'],
  ['Platform', '#platform-title'],
  ['Standards', '#standards-title'],
]

export function DarkFooter() {
  return (
    <footer className="on-dark grain relative overflow-hidden bg-[#141517] text-paper">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_100%,rgb(255_255_255/0.07),transparent_70%),repeating-linear-gradient(170deg,rgb(255_255_255/0.025)_0_2px,transparent_2px_14px)]" />
      <div className={`${container} relative flex flex-col gap-10 py-14 lg:flex-row lg:items-center lg:justify-between`}>
        <Wordmark inverted />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {footerNav.map(([l, h]) => (
              <li key={l}>
                <a href={h} className="text-base text-paper/80 hover:text-paper">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="flex items-center gap-4 text-[0.8125rem] font-medium tracking-[0.28em] text-paper/70 uppercase">
          <span aria-hidden="true" className="h-px w-12 bg-white/30" />A clearer tomorrow
        </p>
      </div>
      <div className={`${container} relative flex flex-col gap-2 border-t border-white/10 py-6 text-[0.875rem] text-paper/60 sm:flex-row sm:justify-between`}>
        <p>Demonstration prototype. Every person, company and document shown is fictional.</p>
        <p>Not affiliated with Companies House or GOV.UK.</p>
      </div>
    </footer>
  )
}
