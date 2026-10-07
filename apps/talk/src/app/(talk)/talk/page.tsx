import { Flex } from 'antd'
import { loadModules } from '@/entities/slide/model/load-modules'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { Lead } from '@/shared/ui/atoms/Lead'
import { ModuleGrid } from '@/widgets/module-grid/ModuleGrid'

export default async function TalkCoverPage() {
  const modules = await loadModules()
  const cards = modules.map((m) => ({
    id: m.id,
    title: m.title,
    slideCount: m.slides.length,
    meta: m.meta,
  }))

  return (
    <Flex vertical align="center" gap={32} style={{ minHeight: '100vh', padding: 48 }}>
      <Flex vertical align="center">
        <SlideTitle align="center">Уязвимости SPA</SlideTitle>
        <Lead align="center" maxWidth={640}>
          От фронтенда до бэкенда
        </Lead>
      </Flex>
      <ModuleGrid modules={cards} />
    </Flex>
  )
}
