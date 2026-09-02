'use client'

import { Row, Col, Image } from 'antd'
import type { z } from 'zod'
import type { BulletsSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { BulletList } from '@/shared/ui/molecules/BulletList'

type BulletsSlideData = z.infer<typeof BulletsSlideSchema>

export function BulletsSlide({ slide }: { slide: BulletsSlideData }) {
  const hasImage = Boolean(slide.image)
  return (
    <>
      <SlideTitle level={2}>{slide.title}</SlideTitle>
      <Row gutter={32} align="middle">
        <Col span={hasImage ? 14 : 24}>
          <BulletList items={slide.items} />
        </Col>
        {hasImage && (
          <Col span={10}>
            <Image src={slide.image} alt="" preview={false} />
          </Col>
        )}
      </Row>
    </>
  )
}
