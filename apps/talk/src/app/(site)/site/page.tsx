import { Flex } from 'antd'
import { getServerMode } from '@/shared/lib/demoMode.server'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'

/** Главная демо-сайта. Пока заглушка: подтверждает режим, полноценный сайт — Фаза 5. */
export default async function SiteHomePage() {
  const mode = await getServerMode()
  return (
    <Flex vertical gap={8} align="flex-start" style={{ padding: 32 }}>
      <SlideTitle level={3}>Демо-сайт</SlideTitle>
      <span data-testid="site-mode">
        <BadgeTag color={mode === 'fixed' ? 'green' : 'red'}>{mode}</BadgeTag>
      </span>
    </Flex>
  )
}
