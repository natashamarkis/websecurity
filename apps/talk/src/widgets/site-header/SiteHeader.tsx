'use client'

import Link from 'next/link'
import { Avatar, Image, Menu, Typography } from 'antd'

interface SiteHeaderProps { userName: string; current?: string }

export function SiteHeader({ userName, current }: SiteHeaderProps) {
  // У страниц SRI-демо отдельная CSP; переходы создают новый документ.
  const scriptDemo = current === 'checkout' || current === 'home'
  const siteLink = (href: string, label: string) => scriptDemo || href === '/site/checkout' || href === '/site'
    ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>
  return (
    <header className="site-header">
      <a href="/site" aria-label="Главная"><Image src="/presentation/etm-logo.png" alt="ЭТМ" width={92} height={36} preview={false} /></a>
      <Menu mode="horizontal" selectedKeys={current ? [current] : []} items={[
        { key: 'home', label: siteLink('/site', 'Главная') },
        { key: 'comments', label: siteLink('/site/comments', 'Комментарии') },
        { key: 'delivery', label: siteLink('/site/delivery', 'Доставка') },
        { key: 'product', label: siteLink('/site/product', 'Товар') },
        { key: 'checkout', label: siteLink('/site/checkout', 'Заказ') },
        { key: 'redirect', label: siteLink('/site/redirect', 'Письмо') },
        { key: 'notifications', label: siteLink('/site/notifications', 'Безопасность') },
        { key: 'catalog', label: siteLink('/site/catalog', 'Каталог') },
      ]} />
      <div className="site-user"><Avatar>{userName.slice(0, 1)}</Avatar><Typography.Text>{userName}</Typography.Text></div>
    </header>
  )
}
