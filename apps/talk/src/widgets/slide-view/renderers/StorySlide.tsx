'use client'

import { Flex, Typography } from 'antd'
import type { z } from 'zod'
import type { StorySlideSchema } from '@ws/slides-schema'

type StorySlideData = z.infer<typeof StorySlideSchema>

export function StorySlide({ slide }: { slide: StorySlideData }) {
  return (
    <Flex vertical align="center" justify="center" gap={16} style={{ height: '100%' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', maxWidth: 900 }}>
        {slide.quote}
      </Typography.Title>
      {slide.source && (
        <Typography.Text type="secondary" style={{ fontSize: 20 }}>
          — {slide.source}
        </Typography.Text>
      )}
    </Flex>
  )
}
