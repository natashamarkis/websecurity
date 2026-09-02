'use client'

import type { ReactNode } from 'react'
import { Typography } from 'antd'

interface SlideTitleProps {
  children: ReactNode
  /** 1 — заголовок модуля/слайда, 2 — секция, 3 — подзаголовок */
  level?: 1 | 2 | 3
  align?: 'left' | 'center'
}

/** Обёртка над Typography.Title. Client-компонент, чтобы вложенный antd-экспорт был доступен из Server Components. */
export function SlideTitle({ children, level = 1, align = 'left' }: SlideTitleProps) {
  return (
    <Typography.Title level={level} style={{ textAlign: align }}>
      {children}
    </Typography.Title>
  )
}
