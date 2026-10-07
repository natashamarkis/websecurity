'use client'

import { Typography } from 'antd'
import type { z } from 'zod'
import type { TwoColumnsSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'

type TwoColumnsSlideData = z.infer<typeof TwoColumnsSlideSchema>

function Column({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <Typography.Title level={2}>{title}</Typography.Title>
      <Typography.Paragraph className="explanation-body">
        {body}
      </Typography.Paragraph>
    </section>
  )
}

export function TwoColumnsSlide({ slide }: { slide: TwoColumnsSlideData }) {
  return (
    <>
      <SlideTitle level={1}>{slide.title}</SlideTitle>
      <div className="topic-columns explanation-columns">
        <Column {...slide.left} />
        <Column {...slide.right} />
      </div>
    </>
  )
}
