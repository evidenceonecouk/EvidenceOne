import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="mx-auto max-w-[88rem] px-4 py-24 sm:px-6">
      <p className="text-[0.9375rem] font-medium tracking-wide text-slate uppercase">Page not found</p>
      <h1 className="mt-2 text-4xl font-normal tracking-[-0.03em] text-ink">We could not find that page.</h1>
      <p className="mt-4 text-lg text-graphite">Check the address, or go back to the start.</p>
      <Button asChild className="mt-8">
        <Link to="/">Back to the start</Link>
      </Button>
    </div>
  )
}
