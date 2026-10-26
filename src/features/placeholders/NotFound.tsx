import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { StateScreen } from '@/components/app/StateScreen'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <StateScreen
      icon={Compass}
      tone="mist"
      kicker="Page not found"
      title="We could not find that page"
      description="Check the address, or go back to the start."
      actions={
        <Button asChild>
          <Link to="/">Back to the start</Link>
        </Button>
      }
    />
  )
}
