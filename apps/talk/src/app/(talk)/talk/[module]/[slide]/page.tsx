import { notFound } from 'next/navigation'
import { loadModules, findModule } from '@/entities/slide/model/load-modules'
import { TalkSlidePage } from '@/pages-layer/talk/TalkSlidePage'

interface SlideRouteProps {
  params: Promise<{ module: string; slide: string }>
}

export default async function SlideRoute({ params }: SlideRouteProps) {
  const { module: moduleId, slide } = await params
  const modules = await loadModules()
  const module = findModule(modules, moduleId)
  const index = Number(slide)

  if (!module || !Number.isInteger(index) || index < 0 || index >= module.slides.length) {
    notFound()
  }

  const outline = modules.map((m) => ({ id: m.id, title: m.title, section: m.section, slideCount: m.slides.length }))
  return <TalkSlidePage module={module} index={index} outline={outline} />
}
