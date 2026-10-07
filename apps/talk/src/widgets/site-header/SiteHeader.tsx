'use client'

import Link from 'next/link'
import { Avatar, Image, Menu, Typography } from 'antd'

interface SiteHeaderProps { userName: string; current?: string }

export function SiteHeader({ userName, current }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link href="/site" aria-label="Главная"><Image src="/presentation/etm-logo.png" alt="ЭТМ" width={92} height={36} preview={false} /></Link>
      <Menu mode="horizontal" selectedKeys={current ? [current] : []} items={[
        { key: 'home', label: <Link href="/site">Главная</Link> },
        { key: 'comments', label: <Link href="/site/comments">Комментарии</Link> },
        { key: 'delivery', label: <Link href="/site/delivery">Доставка</Link> },
        { key: 'product', label: <Link href="/site/product">Товар</Link> },
      ]} />
      <div className="site-user"><Avatar>{userName.slice(0, 1)}</Avatar><Typography.Text>{userName}</Typography.Text></div>
    </header>
  )
}
