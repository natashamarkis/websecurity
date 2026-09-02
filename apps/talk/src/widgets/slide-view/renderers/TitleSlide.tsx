'use client'

import { Flex } from 'antd'
import type { z } from 'zod'
import type { TitleSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { Lead } from '@/shared/ui/atoms/Lead'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'

type TitleSlideData = z.infer<typeof TitleSlideSchema>

export function TitleSlide({ slide }: { slide: TitleSlideData }) {
  return (
    <Flex vertical align="center" justify="center" gap={8} style={{ height: '100%' }}>
      {slide.moduleNo !== undefined && <BadgeTag>Модуль {slide.moduleNo}</BadgeTag>}
      <SlideTitle align="center">{slide.title}</SlideTitle>
      {slide.subtitle && (
        <Lead align="center" maxWidth={800}>
          {slide.subtitle}
        </Lead>
      )}
    </Flex>
  )
}
