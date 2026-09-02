'use client'

import { Card, Flex, Typography, Button } from 'antd'
import type { z } from 'zod'
import type { DemoSlideSchema } from '@ws/slides-schema'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'
import { Lead } from '@/shared/ui/atoms/Lead'

type DemoSlideData = z.infer<typeof DemoSlideSchema>

/**
 * Точка входа в демо. Кнопка «Показать» пока заглушка — переход подключается
 * в фиче demo-transition (Фаза 4).
 */
export function DemoSlide({ slide }: { slide: DemoSlideData }) {
  const isFixed = slide.mode === 'fixed'
  return (
    <Flex vertical align="center" justify="center" gap={24} style={{ height: '100%' }}>
      <BadgeTag color={isFixed ? 'green' : 'red'}>
        {isFixed ? 'исправленная версия' : 'уязвимая версия'}
      </BadgeTag>
      {slide.caption && <Lead align="center" maxWidth={800}>{slide.caption}</Lead>}
      <Card style={{ minWidth: 520 }}>
        <Flex vertical gap={12}>
          <Typography.Text type="secondary">{slide.route}</Typography.Text>
          {slide.payload && (
            <Typography.Text code style={{ fontSize: 18 }}>
              {slide.payload}
            </Typography.Text>
          )}
          <Button type="primary" size="large">
            Показать
          </Button>
        </Flex>
      </Card>
    </Flex>
  )
}
