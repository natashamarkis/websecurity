'use client'

import { Flex, Typography } from 'antd'

interface BulletListProps {
  items: string[]
}

/** Тезисы слайда: крупный текст, без рамок. (antd List в 6.6 помечен deprecated, поэтому Flex.) */
export function BulletList({ items }: BulletListProps) {
  return (
    <Flex vertical gap={12} component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item) => (
        <li key={item}>
          <Typography.Text style={{ fontSize: 24 }}>• {item}</Typography.Text>
        </li>
      ))}
    </Flex>
  )
}
