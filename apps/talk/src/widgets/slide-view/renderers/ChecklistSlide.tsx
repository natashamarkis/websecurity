'use client'

import { Checkbox, Flex } from 'antd'
import type { z } from 'zod'
import type { ChecklistSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'

type ChecklistSlideData = z.infer<typeof ChecklistSlideSchema>

/** Чеклист, который докладчик может отмечать по ходу. Состояние не сохраняется — это намеренно. */
export function ChecklistSlide({ slide }: { slide: ChecklistSlideData }) {
  return (
    <>
      <SlideTitle level={2}>{slide.title}</SlideTitle>
      <Flex vertical gap={12}>
        {slide.items.map((item) => (
          <Checkbox key={item} style={{ fontSize: 24 }}>
            {item}
          </Checkbox>
        ))}
      </Flex>
    </>
  )
}
