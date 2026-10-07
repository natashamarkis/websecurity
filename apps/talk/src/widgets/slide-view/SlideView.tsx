import type { Slide } from '@ws/slides-schema'
import { TitleSlide } from './renderers/TitleSlide'
import { BulletsSlide } from './renderers/BulletsSlide'
import { StorySlide } from './renderers/StorySlide'
import { TwoColumnsSlide } from './renderers/TwoColumnsSlide'
import { TimelineSlide } from './renderers/TimelineSlide'
import { ChecklistSlide } from './renderers/ChecklistSlide'
import { DemoSlide } from './renderers/DemoSlide'
import { CodeSlide } from './renderers/CodeSlide'
import { UnknownSlide } from './renderers/UnknownSlide'

interface SlideViewProps {
  slide: Slide
}

/**
 * Выбирает рендерер по slide.type. Server-совместимый компонент (без хуков),
 * чтобы внутри можно было использовать асинхронные рендереры (CodeSlide читает файлы).
 */
export function SlideView({ slide }: SlideViewProps) {
  switch (slide.type) {
    case 'title':
      return <TitleSlide slide={slide} />
    case 'bullets':
      return <BulletsSlide slide={slide} />
    case 'story':
      return <StorySlide slide={slide} />
    case 'two-columns':
      return <TwoColumnsSlide slide={slide} />
    case 'timeline':
      return <TimelineSlide slide={slide} />
    case 'checklist':
      return <ChecklistSlide slide={slide} />
    case 'demo':
      return <DemoSlide slide={slide} />
    case 'code':
      return <CodeSlide slide={slide} />
    default:
      return <UnknownSlide type={(slide as { type: string }).type} />
  }
}
