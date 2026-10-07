'use client'

import { Image, Typography } from 'antd'
import type { Slide } from '@ws/slides-schema'

export function TitleSlide({ slide }: { slide: Extract<Slide, { type: 'title' }> }) {
  return (
    <article className={`title-slide ${slide.variant ?? 'section'}`}>
      <div className="title-copy">
        <div className="section-label">{slide.moduleNo ? `Блок 0${slide.moduleNo}` : 'Web Security / Tech Talk'}</div>
        <Typography.Title level={1}>{slide.title}</Typography.Title>
        {slide.subtitle && <Typography.Paragraph className="title-subtitle">{slide.subtitle}</Typography.Paragraph>}
        {slide.variant === 'cover' && <span className="cover-meta">Frontend + Backend <span>/</span> 12 тем</span>}
        {slide.variant === 'closing' && <Typography.Link href="/talk/intro/1">К темам доклада</Typography.Link>}
      </div>
      {slide.image && <Image className="cover-image" src={slide.image} alt="Интерфейс каталога ЭТМ из презентации" preview={false} />}
      {slide.moduleNo && <span className="section-number" aria-hidden="true">{String(slide.moduleNo).padStart(2, '0')}</span>}
    </article>
  )
}
