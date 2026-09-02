'use client'

import { List, Typography } from 'antd'

interface BulletListProps {
  items: string[]
}

/** Обёртка над List для тезисов слайда. Крупный текст, без рамок. */
export function BulletList({ items }: BulletListProps) {
  return (
    <List
      dataSource={items}
      split={false}
      renderItem={(item) => (
        <List.Item style={{ padding: '8px 0', border: 'none' }}>
          <Typography.Text style={{ fontSize: 24 }}>• {item}</Typography.Text>
        </List.Item>
      )}
    />
  )
}
