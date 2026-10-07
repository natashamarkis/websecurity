import { demoUser } from '@/entities/demo-user/model'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { CheckoutDemo } from '@/features/vulnerabilities/third-party-scripts/CheckoutDemo'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const mode = await getServerMode()
  return <>
    <SiteHeader userName={demoUser.name} current="checkout" />
    <div className="site-content"><CheckoutDemo key={mode} mode={mode} thirdPartyPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
  </>
}
