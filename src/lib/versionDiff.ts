import { paramDefs, settingDefs } from '@/data/rules'
import { diffVersions } from '@/lib/rules'
import type { RuleSetVersion } from '@/types/domain'

const labels = {
  params: Object.fromEntries(paramDefs.map((p) => [p.key, { label: p.label, unit: p.unit }])),
  settings: Object.fromEntries(settingDefs.map((s) => [s.key, { label: s.label, options: s.options }])),
}

export const versionChanges = (from: RuleSetVersion, to: RuleSetVersion) => diffVersions(from, to, labels)
