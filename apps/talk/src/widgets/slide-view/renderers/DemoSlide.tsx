'use client'

import { Card, Flex, Typography } from 'antd'
import type { z } from 'zod'
import type { DemoSlideSchema } from '@ws/slides-schema'
import { BadgeTag } from '@/shared/ui/atoms/BadgeTag'
import { Lead } from '@/shared/ui/atoms/Lead'
import { DemoLauncher } from '@/features/demo-transition/DemoLauncher'
import { ViewTransition, DEMO_FRAME_TRANSITION } from '@/shared/lib/viewTransition'

type DemoSlideData = z.infer<typeof DemoSlideSchema>

/** Точка входа в демо. Карточка морфится в окно браузера при переходе. */
export function DemoSlide({ slide }: { slide: DemoSlideData }) {
  const isFixed = slide.mode === 'fixed'
  return (
    <Flex vertical align="center" justify="center" gap={24} style={{ height: '100%' }}>
      <BadgeTag color={isFixed ? 'green' : 'red'}>
        {isFixed ? 'исправленная версия' : 'уязвимая версия'}
      </BadgeTag>
      {slide.caption && <Lead align="center" maxWidth={800}>{slide.caption}</Lead>}
      <ViewTransition name={DEMO_FRAME_TRANSITION}>
        <Card style={{ width: 560, maxWidth: '100%' }}>
          <Flex vertical gap={12}>
            <Typography.Text type="secondary">{slide.route}</Typography.Text>
            {slide.payload && (
              <Typography.Text code style={{ fontSize: 18, overflowWrap: 'anywhere' }}>
                {slide.payload}
              </Typography.Text>
            )}
            <DemoLauncher
              route={slide.route}
              mode={slide.mode}
              payload={slide.payload}
            />
          </Flex>
        </Card>
      </ViewTransition>
    </Flex>
  )
}
