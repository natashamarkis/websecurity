import { demoUser } from '@/entities/demo-user/model'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { ThirdPartyScriptsDemo } from '@/features/vulnerabilities/third-party-scripts/ThirdPartyScriptsDemo'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const mode = await getServerMode()
  return <>
    <SiteHeader userName={demoUser.name} current="checkout" />
    <div className="site-content"><ThirdPartyScriptsDemo key={mode} mode={mode} page="checkout" thirdPartyPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
  </>
}
