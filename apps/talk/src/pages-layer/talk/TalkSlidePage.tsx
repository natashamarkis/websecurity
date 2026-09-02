import type { Module } from '@ws/slides-schema'
import { SlideDeck } from '@/widgets/slide-deck/SlideDeck'
import { SlideView } from '@/widgets/slide-view/SlideView'

interface TalkSlidePageProps {
  module: Module
  index: number
}

/** Композиция страницы слайда: дека + рендер текущего слайда. */
export function TalkSlidePage({ module, index }: TalkSlidePageProps) {
  const slide = module.slides[index]
  if (!slide) return null
  return (
    <SlideDeck moduleTitle={module.title} index={index} total={module.slides.length}>
      <SlideView slide={slide} />
    </SlideDeck>
  )
}
