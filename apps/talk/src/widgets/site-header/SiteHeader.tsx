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
        { key: 'backend', label: 'Бэкенд', children: [
          { key: 'ssrf', label: siteLink('/site/backend/ssrf', 'Импорт каталога') },
          { key: 'sessions', label: siteLink('/site/backend/sessions', 'Сессии') },
          { key: 'sql-injection', label: siteLink('/site/backend/sql-injection', 'Мои заказы') },
          { key: 'brute-force', label: siteLink('/site/backend/brute-force', 'Вход') },
          { key: 'file-download', label: siteLink('/site/backend/file-download', 'Документы') },
        ] },
      ]} />
      <div className="site-user"><Avatar>{userName.slice(0, 1)}</Avatar><Typography.Text>{userName}</Typography.Text></div>
    </header>
  )
}
