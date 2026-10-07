'use client'

import type { z } from 'zod'
import type { TimelineSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { StepTimeline } from '@/shared/ui/organisms/StepTimeline'

type TimelineSlideData = z.infer<typeof TimelineSlideSchema>

export function TimelineSlide({ slide }: { slide: TimelineSlideData }) {
  return (
    <>
      <SlideTitle level={2}>{slide.title}</SlideTitle>
      <StepTimeline steps={slide.steps} />
    </>
  )
}
