import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Plus,
  Save,
  Smartphone,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Checkbox,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { submitPartnerApplication } from '@/store/partnerActions'
import { partnerRoleLabel } from '@/store/partnerSelectors'
import type { PartnerRole } from '@/types/domain'
import {
  emptyForm,
  missingFor,
  type PartnerForm,
  SEED_FORM,
  STEP_TITLES,
  toAnswers,
  type TeamUser,
} from './partnerForm'

const DRAFT_KEY = 'evidenceone.join.partner'
const DEMO_CODE = '482913'

const NATURE = [
  'Accountancy firm',
  'Law firm',
  'Corporate service provider',
  'Formation agent',
  'Tax adviser',
  'Consultant',
  'Family office',
  'Introducer',
  'Other',
]
const REGULATORS = ['SRA', 'ICAEW', 'ACCA', 'Other']
const COUNTRIES = [
  'United Kingdom',
  'Ireland',
  'United Arab Emirates',
  'Germany',
  'Cyprus',
  'Ukraine',
  'Other',
]
const LANGUAGES = ['English', 'Russian', 'Ukrainian', 'Arabic']
const ROLES = Object.keys(partnerRoleLabel) as PartnerRole[]

function loadDraft(
  seededAt: number,
): { form: PartnerForm; step: number } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    if (raw && raw.seededAt === seededAt) return raw
  } catch {
    // No saved draft.
  }
  return null
}

export function JoinPartner() {
  const { state, data, apply } = useDemoStore()
  const draft = loadDraft(state.seededAt)
  const [form, setForm] = useState<PartnerForm>(draft?.form ?? SEED_FORM)
  const [step, setStep] = useState(draft?.step ?? 0)
  const [saved, setSaved] = useState(!!draft)
  const [missing, setMissing] = useState<string[]>([])
  const [reference, setReference] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ seededAt: state.seededAt, form, step }),
      )
    } catch {
      // Storage can be unavailable. The form still works in memory.
    }
  }, [form, step, state.seededAt])

  const patch = <K extends keyof PartnerForm>(
    section: K,
    p: Partial<PartnerForm[K]>,
  ) => {
    setForm((f) => ({ ...f, [section]: { ...f[section], ...p } }))
    setSaved(false)
    setMissing([])
  }

  const goNext = () => {
    const m = missingFor(step, form)
    setMissing(m)
    if (m.length) return
    if (step < STEP_TITLES.length - 1) setStep(step + 1)
    else submit()
  }

  const submit = () => {
    const res = submitPartnerApplication(data, {
      name: form.organisation.legalName,
      answers: toAnswers(form),
      actor: `${form.organisation.contactName}, ${form.organisation.legalName}`,
    })
    apply(() => res)
    setReference(res.applicationId)
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Nothing to clear.
    }
  }

  if (reference)
    return (
      <Submitted name={form.organisation.legalName} reference={reference} />
    )

  return (
    <Page width="narrow">
      <PageHeader
        kicker="Referral Partner onboarding"
        title="Join as a Referral Partner"
        description="A Referral Partner brings clients to Evidence One and tracks their progress. The ACSP each person instructs makes the verification and the decision. A Referral Partner is never the verifying ACSP."
        actions={
          <Button
            variant="ghost"
            onClick={() => {
              setForm(emptyForm())
              setStep(0)
              setSaved(false)
            }}
          >
            Clear the example answers
          </Button>
        }
      />
      <p className="mb-6 text-[0.9375rem] text-slate">
        The form is filled with a fictional practice so you can click through.
        Your answers are saved as you go.
      </p>
      <div className="mb-8">
        <Stepper steps={STEP_TITLES} current={step} />
      </div>

      <Panel aria-labelledby="join-step-title">
        <PanelHeader
          id="join-step-title"
          title={`${step + 1}. ${STEP_TITLES[step]}`}
        />
        <div className="space-y-6 p-5 sm:p-6">
          {step === 0 && <Organisation form={form} patch={patch} />}
          {step === 1 && <Regulatory form={form} patch={patch} />}
          {step === 2 && <Portfolio form={form} patch={patch} />}
          {step === 3 && <Workflow form={form} patch={patch} />}
          {step === 4 && <Commercial form={form} patch={patch} />}
          {step === 5 && <DataAuthority form={form} patch={patch} />}
          {step === 6 && <Declarations form={form} patch={patch} />}

          {missing.length > 0 && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-info/30 bg-info-wash p-4 text-[0.9375rem] text-ink"
            >
              <CircleAlert
                className="mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Before you continue</p>
                <ul className="mt-1 list-disc pl-5">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => {
              setMissing([])
              setStep(step - 1)
            }}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => setSaved(true)}>
              <Save aria-hidden="true" />
              Save and continue later
            </Button>
            <Button onClick={goNext}>
              {step === STEP_TITLES.length - 1
                ? 'Submit for approval'
                : 'Save and continue'}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        {saved && (
          <p
            role="status"
            className="border-t border-line/70 px-5 py-3 text-[0.9375rem] text-graphite sm:px-6"
          >
            Saved. You can leave this page and come back to step {step + 1}.
          </p>
        )}
      </Panel>
    </Page>
  )
}

type PatchFn = <K extends keyof PartnerForm>(
  section: K,
  p: Partial<PartnerForm[K]>,
) => void
interface SectionProps {
  form: PartnerForm
  patch: PatchFn
}

/* Form primitives. Real labels, 16px text, visible focus. */

const inputCls =
  'h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none'

function Text({
  id,
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  id: string
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-base text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[0.875rem] text-slate">
          {hint}
        </p>
      )}
    </div>
  )
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-base text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        <option value="">Choose</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function YesNo({
  name,
  legend,
  value,
  onChange,
  help,
}: {
  name: string
  legend: string
  value: boolean
  onChange: (v: boolean) => void
  help?: ReactNode
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-base text-ink">{legend}</legend>
      {help && <p className="mb-2 text-[0.9375rem] text-slate">{help}</p>}
      <div className="flex gap-3">
        {[
          { label: 'No', v: false },
          { label: 'Yes', v: true },
        ].map((o) => (
          <label
            key={o.label}
            className={cn(
              'inline-flex h-11 min-w-20 cursor-pointer items-center justify-center rounded-lg border px-4 text-base has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
              value === o.v
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-white text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === o.v}
              onChange={() => onChange(o.v)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Chips({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-base text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o)
          return (
            <label
              key={o}
              className={cn(
                'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[0.9375rem] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
                on
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-white text-ink',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() =>
                  onChange(on ? value.filter((x) => x !== o) : [...value, o])
                }
              />
              {on && <Check className="size-4" aria-hidden="true" />}
              {o}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Simulated one-time code by SMS. SMS is used here to confirm a mobile number, never for step-up. */
function MobileConfirm({
  id,
  label,
  mobile,
  confirmed,
  onMobile,
  onConfirmed,
}: {
  id: string
  label: string
  mobile: string
  confirmed: boolean
  onMobile: (v: string) => void
  onConfirmed: (v: boolean) => void
}) {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState(DEMO_CODE)
  const [wrong, setWrong] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-base text-ink">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="tel"
          value={mobile}
          onChange={(e) => {
            onMobile(e.target.value)
            onConfirmed(false)
            setSent(false)
          }}
          className={cn(inputCls, 'max-w-xs')}
        />
        {confirmed ? (
          <span className="inline-flex items-center gap-1.5 text-base text-approve">
            <Check className="size-5" aria-hidden="true" />
            Mobile number confirmed
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={!mobile.trim()}
            onClick={() => setSent(true)}
          >
            <Smartphone aria-hidden="true" />
            Send a code
          </Button>
        )}
      </div>
      {sent && !confirmed && (
        <div className="mt-3 rounded-xl bg-mist p-4">
          <p className="text-[0.9375rem] text-graphite">
            Simulated text message to {mobile}. In the live platform the
            six-digit code arrives by SMS.
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor={`${id}-code`}
                className="mb-1 block text-[0.9375rem] text-ink"
              >
                Six-digit code
              </label>
              <input
                id={`${id}-code`}
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setWrong(false)
                }}
                className={cn(inputCls, 'w-40 font-mono')}
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (code.trim() === DEMO_CODE) onConfirmed(true)
                else setWrong(true)
              }}
            >
              Confirm
            </Button>
          </div>
          {wrong && (
            <p role="alert" className="mt-2 text-[0.9375rem] text-decline">
              That code does not match. Try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Tick({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="cursor-pointer text-base text-ink">
        {children}
      </label>
    </div>
  )
}

const grid = 'grid gap-5 sm:grid-cols-2'

function Organisation({ form, patch }: SectionProps) {
  const o = form.organisation
  const set = (p: Partial<typeof o>) => patch('organisation', p)
  return (
    <>
      <div className={grid}>
        <Text
          id="legal"
          label="Legal name"
          value={o.legalName}
          onChange={(v) => set({ legalName: v })}
        />
        <Text
          id="trading"
          label="Trading name"
          value={o.tradingName}
          onChange={(v) => set({ tradingName: v })}
        />
        <Select
          id="country"
          label="Country"
          value={o.country}
          options={COUNTRIES}
          onChange={(v) => set({ country: v })}
        />
        <Text
          id="regno"
          label="Registration number"
          value={o.registrationNumber}
          onChange={(v) => set({ registrationNumber: v })}
        />
        <Text
          id="addr"
          label="Address"
          value={o.addressLine1}
          onChange={(v) => set({ addressLine1: v })}
        />
        <Text
          id="town"
          label="Town or city"
          value={o.town}
          onChange={(v) => set({ town: v })}
        />
        <Text
          id="postcode"
          label="Postcode"
          value={o.postcode}
          onChange={(v) => set({ postcode: v })}
        />
        <Text
          id="web"
          label="Website"
          value={o.website}
          onChange={(v) => set({ website: v })}
        />
        <Select
          id="nature"
          label="Nature of business"
          value={o.natureOfBusiness}
          options={NATURE}
          onChange={(v) => set({ natureOfBusiness: v })}
        />
      </div>
      <h3 className="pt-2 text-[1.0625rem] font-medium text-ink">
        Main contact
      </h3>
      <div className={grid}>
        <Text
          id="cname"
          label="Name"
          value={o.contactName}
          onChange={(v) => set({ contactName: v })}
        />
        <Text
          id="cemail"
          label="Email"
          type="email"
          value={o.contactEmail}
          onChange={(v) => set({ contactEmail: v })}
        />
        <Text
          id="ctel"
          label="Telephone"
          type="tel"
          value={o.contactTelephone}
          onChange={(v) => set({ contactTelephone: v })}
        />
      </div>
      <MobileConfirm
        id="cmobile"
        label="Mobile number"
        mobile={o.contactMobile}
        confirmed={o.contactMobileConfirmed}
        onMobile={(v) => set({ contactMobile: v })}
        onConfirmed={(v) => set({ contactMobileConfirmed: v })}
      />
    </>
  )
}

function Regulatory({ form, patch }: SectionProps) {
  const r = form.regulatory
  const set = (p: Partial<typeof r>) => patch('regulatory', p)
  return (
    <>
      <YesNo
        name="regulated"
        legend="Is your organisation regulated or supervised?"
        value={r.regulated}
        onChange={(v) => set({ regulated: v })}
      />
      {r.regulated && (
        <Text
          id="regulator"
          label="Regulated or supervised by"
          value={r.regulator}
          onChange={(v) => set({ regulator: v })}
        />
      )}
      <YesNo
        name="aml"
        legend="Are you AML supervised?"
        value={r.amlSupervised}
        onChange={(v) => set({ amlSupervised: v })}
      />
      {r.amlSupervised && (
        <div className={grid}>
          <Text
            id="amlbody"
            label="Supervisory body"
            value={r.amlBody}
            onChange={(v) => set({ amlBody: v })}
          />
          <Text
            id="amlref"
            label="Reference"
            value={r.amlReference}
            onChange={(v) => set({ amlReference: v })}
          />
        </div>
      )}
      <YesNo
        name="isacsp"
        legend="Are you yourself registered as a Companies House ACSP?"
        value={r.isAcsp}
        onChange={(v) => set({ isAcsp: v })}
        help="A firm that is both is onboarded twice, once as a Referral Partner and once as an ACSP. The two roles never merge."
      />
      {r.isAcsp && (
        <div className="space-y-4">
          <div className={grid}>
            <Text
              id="acspname"
              label="ACSP name"
              value={r.acspName}
              onChange={(v) => set({ acspName: v })}
            />
            <Text
              id="acspref"
              label="ACSP reference"
              value={r.acspReference}
              onChange={(v) => set({ acspReference: v })}
            />
          </div>
          <p className="text-[0.9375rem] text-slate">
            To act as an ACSP on Evidence One, apply separately on{' '}
            <Link
              to="/join/acsp"
              className="text-ink underline underline-offset-4"
            >
              Join as an ACSP
            </Link>
            .
          </p>
        </div>
      )}
      <div className="rounded-xl border border-line bg-mist/60 p-4">
        <Tick
          id="not-acsp"
          checked={r.notVerifyingAcspConfirmed}
          onChange={(v) => set({ notVerifyingAcspConfirmed: v })}
        >
          We are joining as a Referral Partner and will not act through the
          platform as the verifying ACSP
        </Tick>
      </div>
    </>
  )
}

function Portfolio({ form, patch }: SectionProps) {
  const p = form.portfolio
  const set = (x: Partial<typeof p>) => patch('portfolio', x)
  return (
    <>
      <div className={grid}>
        <Text
          id="cos"
          label="UK companies you manage"
          type="number"
          value={p.companiesManaged}
          onChange={(v) => set({ companiesManaged: Number(v) })}
        />
        <Text
          id="ppl"
          label="Directors and PSCs who may need to verify"
          type="number"
          value={p.peopleToVerify}
          onChange={(v) => set({ peopleToVerify: Number(v) })}
        />
        <Select
          id="vol"
          label="Expected monthly volume"
          value={p.monthlyVolume}
          options={['1 to 10', '11 to 50', '51 to 200', 'More than 200']}
          onChange={(v) => set({ monthlyVolume: v })}
        />
        <Select
          id="mode"
          label="Invitations"
          value={p.invitationMode}
          options={['Individual', 'Bulk', 'Individual and bulk']}
          onChange={(v) => set({ invitationMode: v })}
        />
      </div>
      <Chips
        legend="Countries your clients live in"
        options={COUNTRIES}
        value={p.clientCountries}
        onChange={(v) => set({ clientCountries: v })}
      />
      <Chips
        legend="Languages your clients use"
        options={LANGUAGES}
        value={p.clientLanguages}
        onChange={(v) => set({ clientLanguages: v })}
      />
      <YesNo
        name="api"
        legend="Do you need an API?"
        value={p.apiNeeded}
        onChange={(v) => set({ apiNeeded: v })}
      />
      <YesNo
        name="wl"
        legend="Do you want white-labelled invitations?"
        value={p.whiteLabelled}
        onChange={(v) => set({ whiteLabelled: v })}
      />
    </>
  )
}

function Workflow({ form, patch }: SectionProps) {
  const w = form.workflow
  const set = (x: Partial<typeof w>) => patch('workflow', x)
  const setUser = (i: number, x: Partial<TeamUser>) =>
    set({ team: w.team.map((u, j) => (j === i ? { ...u, ...x } : u)) })
  const roleNames = ROLES.map((r) => partnerRoleLabel[r])
  return (
    <>
      <Select
        id="enters"
        label="Who enters client details"
        value={w.whoEntersDetails}
        options={['Partner staff, from the register', 'The client', 'Both']}
        onChange={(v) => set({ whoEntersDetails: v })}
      />
      <div className="rounded-xl border border-line bg-mist/60 p-4">
        <p className="text-base font-medium text-ink">
          What the Referral Partner sees
        </p>
        <p className="mt-1 text-base text-graphite">
          Status and check results only. This is fixed for every Referral
          Partner. Documents and evidence stay with the ACSP.
        </p>
      </div>
      <Chips
        legend="Who may create referrals"
        options={roleNames}
        value={w.whoMayCreateReferrals}
        onChange={(v) => set({ whoMayCreateReferrals: v })}
      />
      <Chips
        legend="Who may view status"
        options={roleNames}
        value={w.whoMayViewStatus}
        onChange={(v) => set({ whoMayViewStatus: v })}
      />
      <YesNo
        name="notify"
        legend="Send a notification when a person completes?"
        value={w.completionNotifications}
        onChange={(v) => set({ completionNotifications: v })}
      />
      {w.completionNotifications && (
        <Text
          id="nemail"
          label="Notification email"
          type="email"
          value={w.notificationEmail}
          onChange={(v) => set({ notificationEmail: v })}
        />
      )}
      <div>
        <h3 className="text-[1.0625rem] font-medium text-ink">
          Team users and permissions
        </h3>
        <p className="mt-1 text-[0.9375rem] text-slate">
          Partner Administrator manages the team. Referrer connects companies
          and sends invites. Portfolio Viewer sees status only. Each user
          confirms a mobile number by code.
        </p>
        <ul className="mt-4 space-y-4">
          {w.team.map((u, i) => (
            <li key={i} className="rounded-xl border border-line p-4">
              <div className={grid}>
                <Text
                  id={`u${i}n`}
                  label="Name"
                  value={u.name}
                  onChange={(v) => setUser(i, { name: v })}
                />
                <Text
                  id={`u${i}e`}
                  label="Email"
                  type="email"
                  value={u.email}
                  onChange={(v) => setUser(i, { email: v })}
                />
                <div>
                  <label
                    htmlFor={`u${i}r`}
                    className="mb-1.5 block text-base text-ink"
                  >
                    Role
                  </label>
                  <select
                    id={`u${i}r`}
                    value={u.role}
                    onChange={(e) =>
                      setUser(i, { role: e.target.value as PartnerRole })
                    }
                    className={inputCls}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {partnerRoleLabel[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <MobileConfirm
                  id={`u${i}m`}
                  label="Mobile number"
                  mobile={u.mobile}
                  confirmed={u.mobileConfirmed}
                  onMobile={(v) => setUser(i, { mobile: v })}
                  onConfirmed={(v) => setUser(i, { mobileConfirmed: v })}
                />
              </div>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            set({
              team: [
                ...w.team,
                {
                  name: '',
                  email: '',
                  mobile: '',
                  role: 'referrer',
                  mobileConfirmed: false,
                },
              ],
            })
          }
        >
          <Plus aria-hidden="true" />
          Add a user
        </Button>
      </div>
    </>
  )
}

function Commercial({ form, patch }: SectionProps) {
  const c = form.commercial
  const set = (x: Partial<typeof c>) => patch('commercial', x)
  return (
    <>
      <div className={grid}>
        <Select
          id="pays"
          label="Who pays the ACSP's fee"
          value={c.whoPays}
          options={[
            'The client pays the ACSP',
            'We pay with an Agent Payment Code',
            'Either, case by case',
          ]}
          onChange={(v) => set({ whoPays: v })}
        />
        <Select
          id="billing"
          label="Billing"
          value={c.billing}
          options={['Per case', 'Monthly']}
          onChange={(v) => set({ billing: v })}
        />
        <Text
          id="evol"
          label="Expected cases a month"
          type="number"
          value={c.expectedVolume}
          onChange={(v) => set({ expectedVolume: Number(v) })}
        />
        <Select
          id="cur"
          label="Currency"
          value={c.currency}
          options={['GBP', 'EUR', 'USD']}
          onChange={(v) => set({ currency: v })}
        />
      </div>
      <p className="text-[0.9375rem] text-slate">
        Each ACSP sets its own fee. Evidence One’s platform fee is charged to
        the ACSP on referred cases and deducted from the payment. It is never
        added to what you or your clients pay.
      </p>
      <YesNo
        name="vat"
        legend="Are you VAT registered?"
        value={c.vatRegistered}
        onChange={(v) => set({ vatRegistered: v })}
      />
      {c.vatRegistered && (
        <Text
          id="vatno"
          label="VAT number"
          value={c.vatNumber}
          onChange={(v) => set({ vatNumber: v })}
        />
      )}
      <YesNo
        name="po"
        legend="Do you need a purchase order on invoices?"
        value={c.purchaseOrderRequired}
        onChange={(v) => set({ purchaseOrderRequired: v })}
      />
      {c.purchaseOrderRequired && (
        <Text
          id="ponote"
          label="Purchase order details"
          value={c.purchaseOrderNote}
          onChange={(v) => set({ purchaseOrderNote: v })}
        />
      )}
      <div className="space-y-4 rounded-xl border border-line p-4">
        <YesNo
          name="refpay"
          legend="Do you wish to receive payment for referrals?"
          value={c.wishesReferralPayment}
          onChange={(v) => set({ wishesReferralPayment: v })}
          help="Referral commissions are switched off at launch. Your answer is recorded so the disclosure and consent steps are ready if they are switched on. It never changes the price your clients pay."
        />
        {c.wishesReferralPayment && (
          <>
            <Select
              id="refreg"
              label="Your regulator"
              value={c.referralRegulator}
              options={REGULATORS}
              onChange={(v) => set({ referralRegulator: v })}
            />
            {c.referralRegulator === 'Other' && (
              <Text
                id="refother"
                label="Name of the regulator"
                value={c.referralRegulatorOther}
                onChange={(v) => set({ referralRegulatorOther: v })}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

function DataAuthority({ form, patch }: SectionProps) {
  const d = form.dataAuthority
  const set = (x: Partial<typeof d>) => patch('dataAuthority', x)
  return (
    <>
      <YesNo
        name="auth"
        legend="Do you have your clients’ authority to act for them in connection with their Companies House identity verification?"
        value={d.authorityToAct}
        onChange={(v) => set({ authorityToAct: v })}
      />
      <YesNo
        name="lawful"
        legend="Do you hold the personal details you will enter or confirm lawfully, and are they accurate?"
        value={d.detailsLawfullyHeld}
        onChange={(v) => set({ detailsLawfullyHeld: v })}
      />
      <YesNo
        name="informed"
        legend="Will you tell each person that their details are passed to the ACSP they instruct?"
        value={d.individualsInformed}
        onChange={(v) => set({ individualsInformed: v })}
      />
      <YesNo
        name="ico"
        legend="Are you registered with the Information Commissioner’s Office?"
        value={d.icoRegistered}
        onChange={(v) => set({ icoRegistered: v })}
      />
      {d.icoRegistered && (
        <Text
          id="icoref"
          label="Registration reference"
          value={d.icoReference}
          onChange={(v) => set({ icoReference: v })}
        />
      )}
      <YesNo
        name="transfer"
        legend="Will you send personal details from outside the UK?"
        value={d.transfersOutsideUk}
        onChange={(v) => set({ transfersOutsideUk: v })}
      />
      <p className="text-[0.9375rem] text-slate">
        Referral Partners outside the UK see status only.{' '}
        <PendingDecision code="P11" />
      </p>
    </>
  )
}

function Declarations({ form, patch }: SectionProps) {
  const d = form.declarations
  const set = (x: Partial<typeof d>) => patch('declarations', x)
  return (
    <>
      <p className="text-[0.9375rem] text-slate">
        Declarations are shown in English, the version of record.
      </p>
      <Tick id="d1" checked={d.accurate} onChange={(v) => set({ accurate: v })}>
        The information in this application is accurate and complete.
      </Tick>
      <Tick
        id="d2"
        checked={d.authorised}
        onChange={(v) => set({ authorised: v })}
      >
        I am authorised to make this application and accept these terms for the
        organisation.
      </Tick>
      <Tick
        id="d3"
        checked={d.rolesUnderstood}
        onChange={(v) => set({ rolesUnderstood: v })}
      >
        I understand that the ACSP each person instructs is the service
        provider, that Evidence One is the ACSP’s technology provider, and that
        we see status and check results only.
      </Tick>
      <Tick
        id="d4"
        checked={d.noCodesShared}
        onChange={(v) => set({ noCodesShared: v })}
      >
        We will not ask for, pass on or record any personal code, company
        authentication code or One Login detail through the platform.
      </Tick>
      <Tick
        id="d5"
        checked={d.keepUpToDate}
        onChange={(v) => set({ keepUpToDate: v })}
      >
        We will tell Evidence One if any of these answers change.
      </Tick>
    </>
  )
}

function Submitted({ name, reference }: { name: string; reference: string }) {
  return (
    <Page width="narrow">
      <PageHeader
        kicker="Referral Partner onboarding"
        title="Pending platform approval"
      />
      <Panel className="space-y-4 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-lg text-ink">
          <Check className="size-5 text-approve" aria-hidden="true" />
          Your application has been submitted.
        </p>
        <p className="font-mono text-[0.9375rem] text-graphite">
          Reference {reference}
        </p>
        <p className="text-base text-graphite">
          A Platform Administrator reviews every Referral Partner before it goes
          live. {name} will be told by email. This was recorded in the audit
          trail.
        </p>
        <p className="rounded-xl bg-mist p-4 text-base text-graphite">
          {name} is joining as a Referral Partner. It is not the verifying ACSP.
          The ACSP each person instructs verifies them and makes the decision,
          and Evidence One is that ACSP’s technology provider.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to the home page</Link>
        </Button>
      </Panel>
    </Page>
  )
}
