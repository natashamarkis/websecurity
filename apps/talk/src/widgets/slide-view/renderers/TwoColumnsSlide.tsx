'use client'

import { Row, Col, Card, Typography } from 'antd'
import type { z } from 'zod'
import type { TwoColumnsSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'

type TwoColumnsSlideData = z.infer<typeof TwoColumnsSlideSchema>

function Column({ title, body }: { title: string; body: string }) {
  return (
    <Card title={title} style={{ height: '100%' }}>
      <Typography.Paragraph style={{ fontSize: 20, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
        {body}
      </Typography.Paragraph>
    </Card>
  )
}

export function TwoColumnsSlide({ slide }: { slide: TwoColumnsSlideData }) {
  return (
    <>
      <SlideTitle level={2}>{slide.title}</SlideTitle>
      <Row gutter={24}>
        <Col span={12}>
          <Column {...slide.left} />
        </Col>
        <Col span={12}>
          <Column {...slide.right} />
        </Col>
      </Row>
    </>
  )
}
