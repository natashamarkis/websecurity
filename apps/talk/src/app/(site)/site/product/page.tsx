import { demoUser } from '@/entities/demo-user/model'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { DependencyDemo } from '@/features/vulnerabilities/dependencies/DependencyDemo'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function ProductPage() {
  const mode = await getServerMode()
  return <>
    <SiteHeader userName={demoUser.name} current="product" />
    <div className="site-content"><DependencyDemo mode={mode} /></div>
  </>
}
