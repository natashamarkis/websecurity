'use client'

import type { ReactNode } from 'react'
import { Tag } from 'antd'

interface BadgeTagProps {
  children: ReactNode
  color?: string
}

/** Обёртка над Tag для бейджей CWE / CVSS / OWASP и статусов. */
export function BadgeTag({ children, color }: BadgeTagProps) {
  return (
    <Tag color={color} style={{ fontSize: 14, padding: '2px 10px' }}>
      {children}
    </Tag>
  )
}
