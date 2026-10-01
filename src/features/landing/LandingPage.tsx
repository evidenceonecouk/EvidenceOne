import { Audiences } from './sections/Audiences'
import { Standards } from './sections/Closing'
import { Hub, Steps, TrustStrip } from './sections/Connect'
import { DarkFooter, Forward } from './sections/Forward'
import { Hero } from './sections/Hero'
import { Platform } from './sections/Platform'
import { SeeItWorking } from './sections/SeeItWorking'

export function LandingPage() {
  return (
    <div className="bg-[#f4f4f3]">
      <Hero />
      <Steps />
      <Hub />
      <TrustStrip />
      <SeeItWorking />
      <Platform />
      <Audiences />
      <Standards />
      <Forward />
      <DarkFooter />
    </div>
  )
}
