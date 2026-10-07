import type { Module } from '@ws/slides-schema'
import { SlideDeck } from '@/widgets/slide-deck/SlideDeck'
import { SlideView } from '@/widgets/slide-view/SlideView'
import { NavigationController } from '@/features/slide-navigation/NavigationController'
import type { DeckOutline } from '@/features/slide-navigation/navigation'

interface TalkSlidePageProps {
  module: Module
  index: number
  outline: DeckOutline
}

/** Композиция страницы слайда: дека + рендер текущего слайда + хоткеи. */
export function TalkSlidePage({ module, index, outline }: TalkSlidePageProps) {
  const slide = module.slides[index]
  if (!slide) return null
  return (
    <>
      <NavigationController outline={outline} moduleId={module.id} index={index} />
      <SlideDeck moduleTitle={module.title} index={index} total={module.slides.length}>
        <SlideView slide={slide} />
      </SlideDeck>
    </>
  )
}
