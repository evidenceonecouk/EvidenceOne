import type {
  Company,
  Person,
  RegisterEntry,
  VerificationCase,
} from '@/types/domain'
import type { StepId } from '../journey'

export interface StepProps {
  vc: VerificationCase
  person: Person
  company: Company
  entry: RegisterEntry
  next: () => void
  go: (step: StepId) => void
  /** Mobile browser or desktop browser view. Without it the window width decides. */
  viewMode?: 'mobile' | 'desktop'
}
