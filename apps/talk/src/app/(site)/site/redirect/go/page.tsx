import { demoUser } from '@/entities/demo-user/model'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { RedirectLanding } from '@/features/vulnerabilities/open-redirects/RedirectLanding'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export default async function RedirectGoPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams
  const mode = await getServerMode()
  const next = typeof params.next === 'string' ? params.next : null
  return <>
    <SiteHeader userName={demoUser.name} current="redirect" />
    <div className="site-content"><RedirectLanding next={next} mode={mode} attackerPort={Number(process.env.CSRF_ATTACKER_PORT ?? 3001)} /></div>
  </>
}
