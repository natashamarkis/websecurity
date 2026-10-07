import { getServerMode } from '@/shared/lib/demoMode.server'
import { demoUser } from '@/entities/demo-user/model'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'
import { ThirdPartyScriptsDemo } from '@/features/vulnerabilities/third-party-scripts/ThirdPartyScriptsDemo'

/** Главная показывает риск стороннего скрипта ещё до перехода к оформлению. */
export default async function SiteHomePage() {
  const mode = await getServerMode()
  return (
    <>
      <SiteHeader userName={demoUser.name} current="home" />
      <div className="site-content"><ThirdPartyScriptsDemo key={mode} mode={mode} page="home" thirdPartyPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
    </>
  )
}
