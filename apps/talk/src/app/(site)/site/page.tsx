import { Flex } from 'antd'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { demoUser } from '@/entities/demo-user/model'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { Lead } from '@/shared/ui/atoms/Lead'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'

/** Главная демо-сайта: приветствие и навигация к страницам с уязвимостями. */
export default async function SiteHomePage() {
  const mode = await getServerMode()
  return (
    <>
      <SiteHeader userName={demoUser.name} current="home" />
      <Flex vertical gap={8} align="flex-start" className="site-content">
        <SlideTitle level={3}>Привет, {demoUser.name}!</SlideTitle>
        <Lead maxWidth={640}>
          Это обычный сайт с комментариями. Настолько обычный, что в нём есть всё то же,
          что и в реальных проектах — включая ошибки.
        </Lead>
        <span data-testid="site-mode">
          <BadgeTag color={mode === 'fixed' ? 'green' : 'red'}>{mode}</BadgeTag>
        </span>
      </Flex>
    </>
  )
}
