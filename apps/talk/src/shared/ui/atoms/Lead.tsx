'use client'

import type { ReactNode } from 'react'
import { Typography } from 'antd'

interface LeadProps {
  children: ReactNode
  align?: 'left' | 'center'
  maxWidth?: number
}

/** Обёртка над Typography.Paragraph для вводного/подзаголовочного текста слайда. */
export function Lead({ children, align = 'left', maxWidth }: LeadProps) {
  return (
    <Typography.Paragraph type="secondary" style={{ fontSize: 20, textAlign: align, maxWidth }}>
      {children}
    </Typography.Paragraph>
  )
}
