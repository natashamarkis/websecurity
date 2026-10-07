'use client'

import Link from 'next/link'
import { Avatar, Image, Menu, Typography } from 'antd'

interface SiteHeaderProps { userName: string; current?: string }

export function SiteHeader({ userName, current }: SiteHeaderProps) {
  const HomeLink = current === 'checkout' ? 'a' : Link
  // У checkout отдельная CSP: при входе и выходе нужны заголовки нового документа.
  const siteLink = (href: string, label: string) => current === 'checkout' || href === '/site/checkout'
    ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>
  return (
    <header className="site-header">
      <HomeLink href="/site" aria-label="Главная"><Image src="/presentation/etm-logo.png" alt="ЭТМ" width={92} height={36} preview={false} /></HomeLink>
      <Menu mode="horizontal" selectedKeys={current ? [current] : []} items={[
        { key: 'home', label: siteLink('/site', 'Главная') },
        { key: 'comments', label: siteLink('/site/comments', 'Комментарии') },
        { key: 'delivery', label: siteLink('/site/delivery', 'Доставка') },
        { key: 'product', label: siteLink('/site/product', 'Товар') },
        { key: 'checkout', label: siteLink('/site/checkout', 'Заказ') },
      ]} />
      <div className="site-user"><Avatar>{userName.slice(0, 1)}</Avatar><Typography.Text>{userName}</Typography.Text></div>
    </header>
  )
}
