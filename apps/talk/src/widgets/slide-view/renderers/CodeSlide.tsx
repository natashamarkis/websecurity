'use client'

import { Flex, Typography } from 'antd'
import type { z } from 'zod'
import type { CodeSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'

type CodeSlideData = z.infer<typeof CodeSlideSchema>

/**
 * Заглушка: показывает, какие файлы будут подсвечены.
 * Чтение файлов и подсветка через shiki подключаются в Task 3.5.
 */
export function CodeSlide({ slide }: { slide: CodeSlideData }) {
  return (
    <>
      {slide.title && <SlideTitle level={2}>{slide.title}</SlideTitle>}
      <Flex vertical gap={8}>
        <Typography.Text code>{slide.vulnerable.file}</Typography.Text>
        {slide.fixed && <Typography.Text code>{slide.fixed.file}</Typography.Text>}
      </Flex>
    </>
  )
}
