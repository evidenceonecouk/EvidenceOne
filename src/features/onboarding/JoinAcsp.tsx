import { ArrowLeft, ArrowRight, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Page, PageHeader, Panel } from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { PACKAGES_PROVISIONAL_NOTE } from '@/data/packages'
import { submitApplication } from '@/store/onboardingActions'
import { useDemoStore } from '@/store/DemoStore'
import type { OnboardingApplication } from '@/types/domain'
import {
  CheckField,
  CheckGroup,
  MobileConfirm,
  NumberField,
  RadioGroup,
  SelectField,
  Subsection,
  TextField,
} from './joinFields'

/*
  Join as an ACSP. Every answer is a typed field stored by section, never a
  free-text blob. The form is seeded with a fictional firm so a presenter can
  click straight through. It ends in "Pending platform approval": a Platform
  Administrator approves every ACSP before it goes live.
*/

interface UserRow {
  id: string
  name: string
  email: string
  mobile: string
  admin: boolean
  reviewer: boolean
  confirmed: boolean
}

interface Form {
  reg: {
    firmName: string
    firmKind: string
    acspReference: string
    supervisor: string
    supervisorNumber: string
    bothCurrent: boolean
    piApplies: boolean
    piInsurer: string
  }
  people: {
    users: UserRow[]
    finalAuthority: string
    contactName: string
    contactMobile: string
    contactConfirmed: boolean
  }
  cases: {
    ukResidents: boolean
    overseasResidents: boolean
    countriesAccepted: string
    countriesExcluded: string
    documentTypes: string[]
    issuingCountries: string
    nonBiometric: boolean
    languages: string[]
    directors: boolean
    pscs: boolean
    proposedDirectors: boolean
    higherRisk: boolean
    exclusions: string[]
  }
  commercial: {
    feeStandard: number
    feeEnhanced: number
    currency: string
    perDay: number
    perWeek: number
    perMonth: number
    turnaroundHours: number
    acceptingNew: boolean
    payoutConnected: boolean
    vatRegistered: boolean
    vatNumber: string
    /** No platform default: each ACSP chooses (P6, decided 19 October). */
    pepScreening: '' | 'on' | 'off'
    addressCheck: '' | 'on' | 'off'
  }
  evidence: {
    retention: 'platform' | 'own'
    access: string[]
    retentionConfirmed: boolean
    lawfulSupply: boolean
    dpTerms: boolean
  }
  declarations: boolean[]
}

const DOC_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'UK photocard driving licence' },
  { value: 'national_identity_card', label: 'National identity card' },
  { value: 'biometric_residence_permit', label: 'Biometric residence permit' },
]
const LANGUAGES = [
  'English',
  'Russian',
  'Arabic',
  'Spanish',
  'French',
  'Italian',
  'Chinese (Simplified)',
].map((l) => ({ value: l, label: l }))
const EXCLUSIONS = [
  'Clients from sanctioned jurisdictions',
  'Possible PEP matches',
  'Complex ownership structures',
  'Clients without a UK address history',
].map((l) => ({ value: l, label: l }))
const ACCESS = [
  'ACSP Administrator',
  'ACSP Reviewer',
  'Named senior partner only',
].map((l) => ({ value: l, label: l }))
const DECLARATIONS = [
  'We are registered as an Authorised Corporate Service Provider with Companies House and supervised for anti-money laundering.',
  'The information in this application is accurate and complete.',
  'We remain responsible for every verification we make and for the verification statement we file.',
  'We accept that Evidence One is our technology provider and does not verify identities or make our decisions.',
  'We will tell Evidence One promptly if our registration, supervision or insurance changes, and we will reconfirm each year.',
]

const SEED: Form = {
  reg: {
    firmName: 'Calder & Wynne Legal LLP',
    firmKind: 'Law firm',
    acspReference: 'ACSP-0455-3921',
    supervisor: 'Solicitors Regulation Authority',
    supervisorNumber: 'SRA-702218',
    bothCurrent: true,
    piApplies: true,
    piInsurer: 'Northern Mutual Professional Indemnity',
  },
  people: {
    users: [
      {
        id: 'u1',
        name: 'Imogen Calder',
        email: 'imogen.calder@calderwynne.example',
        mobile: '07700 900801',
        admin: true,
        reviewer: true,
        confirmed: false,
      },
      {
        id: 'u2',
        name: 'Ravi Wynne',
        email: 'ravi.wynne@calderwynne.example',
        mobile: '07700 900802',
        admin: false,
        reviewer: true,
        confirmed: true,
      },
    ],
    finalAuthority: 'u1',
    contactName: 'Imogen Calder',
    contactMobile: '07700 900801',
    contactConfirmed: true,
  },
  cases: {
    ukResidents: true,
    overseasResidents: true,
    countriesAccepted: 'United Kingdom, Ireland, France, Spain',
    countriesExcluded: 'Iran, North Korea, Syria',
    documentTypes: ['passport', 'driving_licence'],
    issuingCountries: 'Any',
    nonBiometric: false,
    languages: ['English', 'French'],
    directors: true,
    pscs: true,
    proposedDirectors: false,
    higherRisk: false,
    exclusions: ['Clients from sanctioned jurisdictions'],
  },
  commercial: {
    feeStandard: 135,
    feeEnhanced: 190,
    currency: 'GBP',
    perDay: 8,
    perWeek: 30,
    perMonth: 110,
    turnaroundHours: 48,
    acceptingNew: true,
    payoutConnected: false,
    vatRegistered: true,
    vatNumber: 'GB 288 4410 63',
    pepScreening: '',
    addressCheck: '',
  },
  evidence: {
    retention: 'platform',
    access: ['ACSP Administrator', 'ACSP Reviewer'],
    retentionConfirmed: true,
    lawfulSupply: true,
    dpTerms: true,
  },
  declarations: DECLARATIONS.map(() => true),
}

const STEPS = [
  'Regulatory status',
  'Who verifies',
  'Cases accepted',
  'Commercial',
  'Evidence',
  'Declarations',
]
const DRAFT_KEY = 'evidenceone.join-acsp'

function loadDraft(): { form: Form; step: number } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Storage can be unavailable; the form still works in memory.
  }
  return { form: SEED, step: 0 }
}

/** Each section's required answers. An empty list means the step can continue. */
function missing(step: number, f: Form): string[] {
  const out: string[] = []
  const need = (ok: boolean, label: string) => !ok && out.push(label)
  if (step === 0) {
    need(!!f.reg.firmName.trim(), 'Firm name')
    need(!!f.reg.acspReference.trim(), 'ACSP reference')
    need(!!f.reg.supervisor.trim(), 'AML supervisor')
    need(!!f.reg.supervisorNumber.trim(), 'AML supervisor number')
    need(f.reg.bothCurrent, 'Confirmation that both are current')
  }
  if (step === 1) {
    need(f.people.users.length > 0, 'At least one user')
    need(
      f.people.users.every((u) => u.name.trim() && (u.admin || u.reviewer)),
      'A name and at least one role for every user',
    )
    need(
      f.people.users.every((u) => u.confirmed),
      'A confirmed mobile number for every user',
    )
    need(f.people.contactConfirmed, 'A confirmed mobile number for the contact')
    need(
      f.people.users.some(
        (u) => u.id === f.people.finalAuthority && u.reviewer,
      ),
      'A final decision authority who is an ACSP Reviewer',
    )
  }
  if (step === 2) {
    need(f.cases.ukResidents || f.cases.overseasResidents, 'A client residence')
    need(f.cases.documentTypes.length > 0, 'At least one document type')
    need(f.cases.languages.length > 0, 'At least one language')
    need(
      f.cases.directors || f.cases.pscs || f.cases.proposedDirectors,
      'At least one role you will verify',
    )
  }
  if (step === 3) {
    need(f.commercial.feeStandard > 0, 'A standard fee')
    need(f.commercial.perDay > 0, 'A daily maximum')
    need(f.commercial.payoutConnected, 'A connected payout account')
    need(!!f.commercial.pepScreening, 'A choice on PEP and sanctions screening')
    need(
      !!f.commercial.addressCheck,
      'A choice on the electronic address check',
    )
  }
  if (step === 4) {
    need(f.evidence.retentionConfirmed, 'Retention period confirmation')
    need(f.evidence.dpTerms, 'Acceptance of the data-processing terms')
  }
  if (step === 5) need(f.declarations.every(Boolean), 'Every declaration')
  return out
}

function toAnswers(f: Form): OnboardingApplication['answers'] {
  return {
    regulatoryStatus: {
      firmName: f.reg.firmName,
      firmKind: f.reg.firmKind,
      acspReference: f.reg.acspReference,
      amlSupervisor: f.reg.supervisor,
      amlSupervisorNumber: f.reg.supervisorNumber,
      bothCurrentConfirmed: f.reg.bothCurrent,
      professionalIndemnityApplies: f.reg.piApplies,
      professionalIndemnityInsurer: f.reg.piApplies ? f.reg.piInsurer : '',
    },
    whoVerifies: {
      userNames: f.people.users.map((u) => u.name),
      acspAdministrators: f.people.users
        .filter((u) => u.admin)
        .map((u) => u.name),
      acspReviewers: f.people.users
        .filter((u) => u.reviewer)
        .map((u) => u.name),
      userMobiles: f.people.users.map((u) => u.mobile),
      userMobilesConfirmed: f.people.users.every((u) => u.confirmed),
      finalDecisionAuthority:
        f.people.users.find((u) => u.id === f.people.finalAuthority)?.name ??
        '',
      contactName: f.people.contactName,
      contactMobile: f.people.contactMobile,
      contactMobileConfirmed: f.people.contactConfirmed,
    },
    casesAccepted: {
      ukResidentClients: f.cases.ukResidents,
      overseasResidentClients: f.cases.overseasResidents,
      residenceCountriesAccepted: splitList(f.cases.countriesAccepted),
      excludedJurisdictions: splitList(f.cases.countriesExcluded),
      documentTypes: f.cases.documentTypes,
      issuingCountries: splitList(f.cases.issuingCountries),
      nonBiometricDocuments: f.cases.nonBiometric,
      languages: f.cases.languages,
      directors: f.cases.directors,
      pscs: f.cases.pscs,
      proposedDirectors: f.cases.proposedDirectors,
      higherRiskOrManualReview: f.cases.higherRisk,
      automaticExclusions: f.cases.exclusions,
    },
    commercial: {
      standardFee: f.commercial.feeStandard,
      enhancedFee: f.commercial.feeEnhanced,
      currency: f.commercial.currency,
      maxPerDay: f.commercial.perDay,
      maxPerWeek: f.commercial.perWeek,
      maxPerMonth: f.commercial.perMonth,
      targetTurnaroundHours: f.commercial.turnaroundHours,
      acceptingNewCases: f.commercial.acceptingNew,
      payoutAccountConnected: f.commercial.payoutConnected,
      vatRegistered: f.commercial.vatRegistered,
      vatNumber: f.commercial.vatRegistered ? f.commercial.vatNumber : '',
      pepAndSanctionsScreening: f.commercial.pepScreening,
      electronicAddressCheck: f.commercial.addressCheck,
      referredCasesPlan: 'Platform fee deducted automatically',
      ownClientsPlan: 'Easy, Pro or Scale package, chosen after approval',
    },
    evidenceAndRetention: {
      evidenceRetention: f.evidence.retention,
      evidenceAccess: f.evidence.access,
      retentionSevenYearsFromDecisionConfirmed: f.evidence.retentionConfirmed,
      supplyToCompaniesHouseWhenRequired: f.evidence.lawfulSupply,
      dataProcessingTermsAccepted: f.evidence.dpTerms,
    },
    declarations: {
      allDeclarationsMade: f.declarations.every(Boolean),
      count: f.declarations.length,
    },
  }
}

const splitList = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

export function JoinAcsp() {
  const { apply } = useDemoStore()
  const toast = useToast()
  const [{ form, step }, setDraft] = useState(loadDraft)
  const [showErrors, setShowErrors] = useState(false)
  const [done, setDone] = useState<string>()

  const setForm = (next: Form) => setDraft((d) => ({ ...d, form: next }))
  const setStep = (s: number) => {
    setShowErrors(false)
    setDraft((d) => ({ ...d, step: s }))
    window.scrollTo({ top: 0 })
  }
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }))
    } catch {
      // Draft saving is a convenience only.
    }
  }, [form, step])

  const problems = missing(step, form)
  const last = step === STEPS.length - 1

  const next = () => {
    if (problems.length) return setShowErrors(true)
    if (!last) return setStep(step + 1)
    let id = ''
    apply((d) => {
      const r = submitApplication(
        d,
        {
          kind: 'acsp',
          name: form.reg.firmName,
          answers: toAnswers(form),
        },
        form.people.contactName,
      )
      id = r.applicationId
      return r
    })
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Nothing to clear.
    }
    setDone(id)
  }

  if (done)
    return (
      <Page width="narrow">
        <PageHeader
          kicker="ACSP onboarding"
          title="Pending platform approval"
        />
        <Panel className="p-6 sm:p-8" role="status">
          <p className="text-lg leading-relaxed text-ink">
            Thank you. {form.reg.firmName} has applied to join Evidence One as
            an ACSP. A Platform Administrator will check your registration and
            supervision, then approve the application.
          </p>
          <p className="mt-3 text-base text-graphite">
            Application reference{' '}
            <span className="font-mono text-ink">{done}</span>. You can accept
            cases once it is approved. Every answer is stored as a separate
            field, and the submission is written to the audit trail.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to the start</Link>
          </Button>
        </Panel>
      </Page>
    )

  return (
    <Page width="narrow">
      <PageHeader
        kicker="ACSP onboarding"
        title="Join as an ACSP"
        description="You are the service provider and stay responsible for every verification. Evidence One is your technology provider."
      />
      <div className="mb-6 overflow-x-auto pb-2">
        <Stepper steps={STEPS} current={step} />
      </div>

      <Panel className="space-y-6 p-5 sm:p-7">
        <h2 className="text-xl font-medium text-ink">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>
        {step === 0 && <RegStep form={form} setForm={setForm} />}
        {step === 1 && <PeopleStep form={form} setForm={setForm} />}
        {step === 2 && <CasesStep form={form} setForm={setForm} />}
        {step === 3 && <CommercialStep form={form} setForm={setForm} />}
        {step === 4 && <EvidenceStep form={form} setForm={setForm} />}
        {step === 5 && <DeclarationsStep form={form} setForm={setForm} />}

        {showErrors && problems.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-decline/30 bg-decline-wash px-4 py-3 text-base text-decline"
          >
            <p className="font-medium">Please complete:</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                toast({
                  title: 'Draft saved',
                  description: 'You can come back to this application later.',
                })
              }
            >
              <Save aria-hidden="true" />
              Save and continue later
            </Button>
            <Button type="button" onClick={next}>
              {last ? 'Submit application' : 'Save and continue'}
              {!last && <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </Panel>
    </Page>
  )
}

interface StepProps {
  form: Form
  setForm: (f: Form) => void
}

function RegStep({ form: f, setForm }: StepProps) {
  const set = (p: Partial<Form['reg']>) =>
    setForm({ ...f, reg: { ...f.reg, ...p } })
  return (
    <div className="space-y-5">
      <TextField
        label="Firm name"
        value={f.reg.firmName}
        onChange={(v) => set({ firmName: v })}
      />
      <TextField
        label="Type of firm"
        value={f.reg.firmKind}
        onChange={(v) => set({ firmKind: v })}
      />
      <TextField
        label="ACSP reference"
        hint="Your Companies House ACSP reference."
        value={f.reg.acspReference}
        onChange={(v) => set({ acspReference: v })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="AML supervisor"
          value={f.reg.supervisor}
          onChange={(v) => set({ supervisor: v })}
        />
        <TextField
          label="AML supervisor number"
          value={f.reg.supervisorNumber}
          onChange={(v) => set({ supervisorNumber: v })}
        />
      </div>
      <CheckField
        label="Both the ACSP reference and the AML supervision are current."
        checked={f.reg.bothCurrent}
        onChange={(v) => set({ bothCurrent: v })}
      />
      <CheckField
        label="Professional indemnity insurance applies to us."
        checked={f.reg.piApplies}
        onChange={(v) => set({ piApplies: v })}
      />
      {f.reg.piApplies && (
        <TextField
          label="Insurer"
          value={f.reg.piInsurer}
          onChange={(v) => set({ piInsurer: v })}
        />
      )}
    </div>
  )
}

function PeopleStep({ form: f, setForm }: StepProps) {
  const set = (p: Partial<Form['people']>) =>
    setForm({ ...f, people: { ...f.people, ...p } })
  const upd = (id: string, p: Partial<UserRow>) =>
    set({
      users: f.people.users.map((u) => (u.id === id ? { ...u, ...p } : u)),
    })
  return (
    <div className="space-y-6">
      <p className="text-base text-graphite">
        Reviewers make the decision on each case. A person may be both an ACSP
        Administrator and an ACSP Reviewer. Each mobile number is confirmed by a
        one-time code.
      </p>
      {f.people.users.map((u, i) => (
        <Subsection key={u.id} title={`User ${i + 1}`}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Name"
              value={u.name}
              onChange={(v) => upd(u.id, { name: v })}
            />
            <TextField
              label="Email"
              type="email"
              value={u.email}
              onChange={(v) => upd(u.id, { email: v })}
            />
            <TextField
              label="Mobile number"
              type="tel"
              value={u.mobile}
              onChange={(v) => upd(u.id, { mobile: v, confirmed: false })}
            />
          </div>
          <div>
            <CheckField
              label="ACSP Administrator"
              checked={u.admin}
              onChange={(v) => upd(u.id, { admin: v })}
            />
            <CheckField
              label="ACSP Reviewer"
              checked={u.reviewer}
              onChange={(v) => upd(u.id, { reviewer: v })}
            />
          </div>
          <MobileConfirm
            who={u.name}
            mobile={u.mobile}
            confirmed={u.confirmed}
            onConfirmed={() => upd(u.id, { confirmed: true })}
          />
          {f.people.users.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                set({ users: f.people.users.filter((x) => x.id !== u.id) })
              }
            >
              <Trash2 aria-hidden="true" />
              Remove {u.name || 'this user'}
            </Button>
          )}
        </Subsection>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          set({
            users: [
              ...f.people.users,
              {
                id: `u${Date.now()}`,
                name: '',
                email: '',
                mobile: '',
                admin: false,
                reviewer: true,
                confirmed: false,
              },
            ],
          })
        }
      >
        <Plus aria-hidden="true" />
        Add a user
      </Button>
      <SelectField
        label="Final decision authority"
        hint="The reviewer who has authority over a final approve or decline."
        value={f.people.finalAuthority}
        onChange={(v) => set({ finalAuthority: v })}
        options={f.people.users.map((u) => ({
          value: u.id,
          label: u.name || 'Unnamed user',
        }))}
      />
      <Subsection title="Contact person">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Contact name"
            value={f.people.contactName}
            onChange={(v) => set({ contactName: v })}
          />
          <TextField
            label="Contact mobile number"
            type="tel"
            value={f.people.contactMobile}
            onChange={(v) => set({ contactMobile: v, contactConfirmed: false })}
          />
        </div>
        <MobileConfirm
          who={f.people.contactName}
          mobile={f.people.contactMobile}
          confirmed={f.people.contactConfirmed}
          onConfirmed={() => set({ contactConfirmed: true })}
        />
      </Subsection>
    </div>
  )
}

function CasesStep({ form: f, setForm }: StepProps) {
  const set = (p: Partial<Form['cases']>) =>
    setForm({ ...f, cases: { ...f.cases, ...p } })
  return (
    <div className="space-y-6">
      <Subsection title="Where clients live">
        <CheckField
          label="UK-resident clients"
          checked={f.cases.ukResidents}
          onChange={(v) => set({ ukResidents: v })}
        />
        <CheckField
          label="Overseas-resident clients"
          checked={f.cases.overseasResidents}
          onChange={(v) => set({ overseasResidents: v })}
        />
        <TextField
          label="Countries of residence accepted"
          hint="Separate countries with commas."
          value={f.cases.countriesAccepted}
          onChange={(v) => set({ countriesAccepted: v })}
        />
        <TextField
          label="Countries excluded"
          hint="Separate countries with commas."
          value={f.cases.countriesExcluded}
          onChange={(v) => set({ countriesExcluded: v })}
        />
      </Subsection>
      <Subsection title="Documents and languages">
        <CheckGroup
          legend="Document types accepted"
          options={DOC_TYPES}
          value={f.cases.documentTypes}
          onChange={(v) => set({ documentTypes: v })}
        />
        <TextField
          label="Issuing countries accepted"
          hint="Type Any, or list countries separated by commas."
          value={f.cases.issuingCountries}
          onChange={(v) => set({ issuingCountries: v })}
        />
        <CheckField
          label="We accept non-biometric documents where the standard permits."
          checked={f.cases.nonBiometric}
          onChange={(v) => set({ nonBiometric: v })}
        />
        <CheckGroup
          legend="Languages you can support"
          options={LANGUAGES}
          value={f.cases.languages}
          onChange={(v) => set({ languages: v })}
        />
      </Subsection>
      <Subsection title="Who you will verify">
        <CheckField
          label="Directors"
          checked={f.cases.directors}
          onChange={(v) => set({ directors: v })}
        />
        <CheckField
          label="People with significant control"
          checked={f.cases.pscs}
          onChange={(v) => set({ pscs: v })}
        />
        <CheckField
          label="Proposed directors"
          checked={f.cases.proposedDirectors}
          onChange={(v) => set({ proposedDirectors: v })}
        />
        <CheckField
          label="Higher-risk or manually reviewed cases"
          checked={f.cases.higherRisk}
          onChange={(v) => set({ higherRisk: v })}
        />
        <CheckGroup
          legend="Automatic exclusions"
          hint="Cases you never want allocated to you."
          options={EXCLUSIONS}
          value={f.cases.exclusions}
          onChange={(v) => set({ exclusions: v })}
        />
      </Subsection>
    </div>
  )
}

function CommercialStep({ form: f, setForm }: StepProps) {
  const set = (p: Partial<Form['commercial']>) =>
    setForm({ ...f, commercial: { ...f.commercial, ...p } })
  return (
    <div className="space-y-6">
      <Subsection title="Your fees and capacity">
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Standard verification fee (£, including VAT)"
            value={f.commercial.feeStandard}
            onChange={(v) => set({ feeStandard: v })}
          />
          <NumberField
            label="Enhanced verification fee (£, including VAT)"
            value={f.commercial.feeEnhanced}
            onChange={(v) => set({ feeEnhanced: v })}
          />
          <SelectField
            label="Currency"
            value={f.commercial.currency}
            onChange={(v) => set({ currency: v })}
            options={[{ value: 'GBP', label: 'Pounds sterling (GBP)' }]}
          />
          <NumberField
            label="Target turnaround (hours)"
            hint="Shown to the individual before they instruct you."
            value={f.commercial.turnaroundHours}
            onChange={(v) => set({ turnaroundHours: v })}
          />
          <NumberField
            label="Maximum cases per day"
            value={f.commercial.perDay}
            onChange={(v) => set({ perDay: v })}
          />
          <NumberField
            label="Maximum cases per week"
            value={f.commercial.perWeek}
            onChange={(v) => set({ perWeek: v })}
          />
          <NumberField
            label="Maximum cases per month"
            value={f.commercial.perMonth}
            onChange={(v) => set({ perMonth: v })}
          />
        </div>
        <CheckField
          label="We are accepting new cases."
          checked={f.commercial.acceptingNew}
          onChange={(v) => set({ acceptingNew: v })}
        />
      </Subsection>
      <Subsection title="Payout account">
        <p className="text-base text-graphite">
          Clients pay you. Evidence One collects the payment as your disclosed
          agent, and the secure payment provider pays out to your own account.
        </p>
        {f.commercial.payoutConnected ? (
          <p className="text-base font-medium text-approve">
            Payout account connected through the secure payment provider.
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => set({ payoutConnected: true })}
          >
            Connect a payout account
          </Button>
        )}
      </Subsection>
      <Subsection title="VAT">
        <CheckField
          label="We are VAT registered."
          checked={f.commercial.vatRegistered}
          onChange={(v) => set({ vatRegistered: v })}
        />
        {f.commercial.vatRegistered && (
          <TextField
            label="VAT number"
            value={f.commercial.vatNumber}
            onChange={(v) => set({ vatNumber: v })}
          />
        )}
      </Subsection>
      <Subsection title="Optional checks">
        <p className="text-base text-graphite">
          Each check is your choice. There is no platform default, and the price
          of the identity checks does not change.
        </p>
        <RadioGroup<'on' | 'off'>
          name="pep"
          legend="PEP and sanctions screening"
          value={f.commercial.pepScreening as 'on' | 'off'}
          onChange={(v) => set({ pepScreening: v })}
          options={[
            { value: 'on', label: 'On', hint: 'Screening runs on your cases.' },
            { value: 'off', label: 'Off' },
          ]}
        />
        <RadioGroup<'on' | 'off'>
          name="address-check"
          legend="Electronic address check (UK residents)"
          value={f.commercial.addressCheck as 'on' | 'off'}
          onChange={(v) => set({ addressCheck: v })}
          options={[
            {
              value: 'on',
              label: 'On',
              hint: 'The address of a UK resident is checked electronically.',
            },
            { value: 'off', label: 'Off' },
          ]}
        />
        <div className="rounded-xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
          <p>
            Proof of address is still requested from every individual. Whether a
            passing electronic address check removes the need for the document
            is not yet decided.
          </p>
          <PendingDecision className="mt-2" />
        </div>
        <p className="text-[0.9375rem] text-slate">
          Ongoing PEP and sanctions monitoring: on a package only. Later.
        </p>
      </Subsection>
      <Subsection title="Plan">
        <ul className="list-disc space-y-2 pl-5 text-base text-graphite">
          <li>
            Referred and B2C cases carry the platform fee, £69 plus VAT,
            deducted automatically from each payment.
          </li>
          <li>
            For your own clients you can take a monthly package: Easy £29 (up to
            5 cases, 2 GB), Pro £89 (up to 25 cases, 10 GB) or Scale £199 (up to
            60 cases, 25 GB), each with £5 per additional case. Referred cases
            never count towards the package.
          </li>
          <li>
            Route B filings and ongoing monitoring are available on a package
            only. You can choose a package after approval.
          </li>
        </ul>
        <p className="text-[0.9375rem] text-slate">
          {PACKAGES_PROVISIONAL_NOTE}
        </p>
      </Subsection>
    </div>
  )
}

function EvidenceStep({ form: f, setForm }: StepProps) {
  const set = (p: Partial<Form['evidence']>) =>
    setForm({ ...f, evidence: { ...f.evidence, ...p } })
  return (
    <div className="space-y-6">
      <RadioGroup
        name="retention"
        legend="Where verification evidence is kept"
        value={f.evidence.retention}
        onChange={(v) => set({ retention: v })}
        options={[
          {
            value: 'platform',
            label: 'Evidence One platform storage',
            hint: 'In the client’s own cloud account in London, separate for each ACSP.',
          },
          {
            value: 'own',
            label: 'Our own retention',
            hint: 'You export the records, then remove them from the platform.',
          },
        ]}
      />
      <CheckGroup
        legend="Who may access evidence"
        options={ACCESS}
        value={f.evidence.access}
        onChange={(v) => set({ access: v })}
      />
      <CheckField
        label="We confirm records are kept for 7 years from the reviewer decision, including failed and abandoned cases."
        checked={f.evidence.retentionConfirmed}
        onChange={(v) => set({ retentionConfirmed: v })}
      />
      <CheckField
        label="Evidence may be supplied to Companies House when lawfully required."
        checked={f.evidence.lawfulSupply}
        onChange={(v) => set({ lawfulSupply: v })}
      />
      <CheckField
        label="We accept the data-processing terms. Evidence One processes verification records on our behalf."
        checked={f.evidence.dpTerms}
        onChange={(v) => set({ dpTerms: v })}
      />
    </div>
  )
}

function DeclarationsStep({ form: f, setForm }: StepProps) {
  return (
    <div className="space-y-2">
      {DECLARATIONS.map((d, i) => (
        <CheckField
          key={d}
          label={d}
          checked={f.declarations[i]}
          onChange={(v) =>
            setForm({
              ...f,
              declarations: f.declarations.map((x, j) => (j === i ? v : x)),
            })
          }
        />
      ))}
      <p className="pt-3 text-base text-slate">
        After you submit, the application shows as Pending platform approval.
      </p>
    </div>
  )
}
