import { demoUser } from '@/entities/demo-user/model'
import { OpenRedirectDemo } from '@/features/vulnerabilities/open-redirects/OpenRedirectDemo'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export default function RedirectPage() {
  return <>
    <SiteHeader userName={demoUser.name} current="redirect" />
    <div className="site-content"><OpenRedirectDemo attackerPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
  </>
}
