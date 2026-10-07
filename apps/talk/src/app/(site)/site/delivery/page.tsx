import { demoUser } from '@/entities/demo-user/model'
import { DeliveryProfile } from '@/features/vulnerabilities/csrf/DeliveryProfile'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export const dynamic = 'force-dynamic'

export default function DeliveryPage() {
  return <>
    <SiteHeader userName={demoUser.name} current="delivery" />
    <div className="site-content">
      <DeliveryProfile attackerPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} />
    </div>
  </>
}
