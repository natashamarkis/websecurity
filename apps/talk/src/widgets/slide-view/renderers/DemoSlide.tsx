'use client'

import { Typography } from 'antd'
import type { Slide } from '@ws/slides-schema'
import { DemoLauncher } from '@/features/demo-transition/DemoLauncher'

export function DemoSlide({ slide }: { slide: Extract<Slide, { type: 'demo' }> }) {
  const fixed = slide.mode === 'fixed'
  return (
    <article className="demo-slide">
      <div className={`section-label ${fixed ? 'backend' : 'frontend'}`}>XSS / {fixed ? 'Исправленная версия' : 'Живая демонстрация'}</div>
      <Typography.Title level={1}>{slide.caption ?? 'XSS в комментариях'}</Typography.Title>
      <div className="demo-target">
        <span className="demo-target-label">Комментарии</span>
        <Typography.Text type="secondary">{slide.route}</Typography.Text>
      </div>
      {slide.payload && <pre className="demo-payload"><code>{slide.payload}</code></pre>}
      <DemoLauncher route={slide.route} mode={slide.mode} payload={slide.payload} />
    </article>
  )
}
