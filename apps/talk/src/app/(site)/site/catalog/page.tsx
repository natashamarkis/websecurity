import { demoUser } from '@/entities/demo-user/model'
import { PrototypePollutionDemo } from '@/features/vulnerabilities/prototype-pollution/PrototypePollutionDemo'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'

export default async function CatalogPage() {
  const mode = await getServerMode()
  return <>
    <SiteHeader userName={demoUser.name} current="catalog" />
    <div className="site-content"><PrototypePollutionDemo mode={mode} /></div>
  </>
}
