'use client'

import Link from 'next/link'
import { Flex, Typography, Avatar, Menu } from 'antd'

interface SiteHeaderProps {
  userName: string
  current?: string
}

/** Шапка демо-сайта: логотип, навигация, «залогиненный» пользователь. */
export function SiteHeader({ userName, current }: SiteHeaderProps) {
  return (
    <Flex align="center" gap={24} style={{ padding: '8px 24px', borderBottom: '1px solid #f0f0f0' }}>
      <Link href="/site" style={{ textDecoration: 'none' }}>
        <Typography.Text strong style={{ fontSize: 18 }}>
          demo.site
        </Typography.Text>
      </Link>
      <Menu
        mode="horizontal"
        selectedKeys={current ? [current] : []}
        style={{ flex: 1, borderBottom: 'none' }}
        items={[
          { key: 'home', label: <Link href="/site">Главная</Link> },
          { key: 'comments', label: <Link href="/site/comments">Комментарии</Link> },
        ]}
      />
      <Flex align="center" gap={8}>
        <Avatar>{userName.slice(0, 1)}</Avatar>
        <Typography.Text>{userName}</Typography.Text>
      </Flex>
    </Flex>
  )
}
