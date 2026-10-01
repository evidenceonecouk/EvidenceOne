/** Scrolls to the element a citation points at and briefly outlines it. */
export function highlightCite(key: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-cite="${CSS.escape(key)}"]`,
  )
  if (!el) return false
  const details = el.closest('details')
  if (details && !details.open) details.open = true
  el.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'center',
  })
  el.classList.remove('cite-flash')
  void el.offsetWidth
  el.classList.add('cite-flash')
  window.setTimeout(() => el.classList.remove('cite-flash'), 2300)
  return true
}
