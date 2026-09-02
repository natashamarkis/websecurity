'use client'

import type { ReactNode } from 'react'
import { Flex, Progress, Typography } from 'antd'

interface SlideDeckProps {
  moduleTitle: string
  /** индекс текущего слайда, с нуля */
  index: number
  total: number
  children: ReactNode
}

/** Раскладка экрана слайда: шапка с названием модуля и счётчиком, тело, прогресс внизу. */
export function SlideDeck({ moduleTitle, index, total, children }: SlideDeckProps) {
  const percent = total > 0 ? Math.round(((index + 1) / total) * 100) : 0
  return (
    <Flex vertical style={{ height: '100vh', padding: '32px 64px 24px' }} gap={16}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          {moduleTitle}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          {index + 1} / {total}
        </Typography.Text>
      </Flex>
      <Flex vertical flex={1} justify="center" style={{ minHeight: 0 }}>
        {children}
      </Flex>
      <Progress percent={percent} showInfo={false} size="small" />
    </Flex>
  )
}
