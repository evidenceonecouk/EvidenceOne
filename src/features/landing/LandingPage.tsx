import { Audiences } from './sections/Audiences'
import { ClosingCta, Footer, Numbers, Standards } from './sections/Closing'
import { Hero } from './sections/Hero'
import { Pillars } from './sections/Pillars'
import { Platform } from './sections/Platform'

export function LandingPage() {
  return (
    <div className="bg-white">
      <Hero />
      <Pillars />
      <Platform />
      <Audiences />
      <Numbers />
      <Standards />
      <ClosingCta />
      <Footer />
    </div>
  )
}
