/*
  Placeholder: the referral arrangement disclosure shown before payment when
  referral commissions are On. Replaced by the Super Administrator workstream.
  Exact wording: "Referral arrangement disclosure. [Partner] introduced you to
  Evidence One and may receive £[amount] if you purchase this service. This
  commercial arrangement does not increase the price you pay."
*/
export function ReferralDisclosureCard(props: {
  partnerName: string
  amount: number
  /** Whether the regulator requires consent rather than acknowledgement. */
  consentRequired: boolean
  onAcknowledge: (acknowledged: boolean) => void
}) {
  void props
  return null
}
