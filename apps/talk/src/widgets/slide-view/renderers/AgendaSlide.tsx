'use client'

import Link from 'next/link'
import { Typography } from 'antd'
import { ArrowRightOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { Slide } from '@ws/slides-schema'

export function AgendaSlide({ slide }: { slide: Extract<Slide, { type: 'agenda' }> }) {
  return (
    <article className="agenda-slide">
      <div className="section-label">12 тем / 2 блока</div>
      <Typography.Title level={1}>{slide.title}</Typography.Title>
      <div className="agenda-columns">
        {slide.groups.map((group) => (
          <section key={group.section}>
            <Typography.Title level={2} className={`agenda-heading ${group.section}`}>{group.title}</Typography.Title>
            <ol className="agenda-list">
              {group.items.map((item, index) => (
                <li key={item.moduleId}>
                  <Link href={`/talk/${item.moduleId}/0`}>
                    <span className="agenda-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{item.title}</span>
                    {item.moduleId === 'xss' ? <PlayCircleOutlined aria-label="С демонстрацией" /> : <ArrowRightOutlined />}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </article>
  )
}
