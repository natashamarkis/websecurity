import { demoUser } from '@/entities/demo-user/model'
import { ClickjackingDemo } from '@/features/vulnerabilities/clickjacking/ClickjackingDemo'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export default function NotificationsPage() {
  return <>
    <SiteHeader userName={demoUser.name} current="notifications" />
    <div className="site-content"><ClickjackingDemo attackerPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
  </>
}
