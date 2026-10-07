'use client'

import { Typography } from 'antd'
import type { Slide } from '@ws/slides-schema'
import { DemoLauncher } from '@/features/demo-transition/DemoLauncher'

const labels: Record<string, string> = {
  '/site/comments': 'XSS', '/site/delivery': 'CSRF', '/site/product': 'npm-зависимости',
  '/site': 'Сторонние скрипты', '/site/checkout': 'Сторонние скрипты',
  '/site/redirect': 'Open Redirect', '/site/notifications': 'Clickjacking', '/site/catalog': 'Prototype Pollution',
  '/site/backend/ssrf': 'SSRF', '/site/backend/sessions': 'Session Fixation',
  '/site/backend/sql-injection': 'SQL Injection', '/site/backend/brute-force': 'Brute Force',
  '/site/backend/file-download': 'IDOR / Path Traversal',
}

export function DemoSlide({ slide }: { slide: Extract<Slide, { type: 'demo' }> }) {
  const fixed = slide.mode === 'fixed'
  const label = labels[slide.route] ?? 'Демонстрация'
  return (
    <article className="demo-slide">
      <div className={`section-label ${slide.route.startsWith('/site/backend/') ? 'backend' : 'frontend'}`}>{label} / {fixed ? 'Исправленная версия' : 'Живая демонстрация'}</div>
      <Typography.Title level={1}>{slide.caption ?? label}</Typography.Title>
      <div className="demo-target">
        <span className="demo-target-label">{label}</span>
        <Typography.Text type="secondary">{slide.route}</Typography.Text>
      </div>
      {slide.payload && <pre className="demo-payload"><code>{slide.payload}</code></pre>}
      <DemoLauncher route={slide.route} mode={slide.mode} payload={slide.payload} />
    </article>
  )
}
