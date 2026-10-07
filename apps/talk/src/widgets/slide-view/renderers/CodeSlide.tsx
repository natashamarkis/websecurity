import { Tabs } from 'antd'
import type { z } from 'zod'
import type { CodeSlideSchema } from '@ws/slides-schema'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'
import { CodeBlock } from '@/shared/ui/molecules/CodeBlock'
import { readCode } from '@/features/code-view/read-code'
import { highlight } from '@/shared/lib/highlight'

type CodeSlideData = z.infer<typeof CodeSlideSchema>

/**
 * Серверный рендерер: читает реальные файлы фичи из src/ и подсвечивает их.
 * Основной блок показывает исполняемый код демо; примеры запросов берутся из слайда.
 */
export async function CodeSlide({ slide }: { slide: CodeSlideData }) {
  const vulnerableHtml = await highlight(await readCode(slide.vulnerable.file), slide.lang)
  const fixedHtml = slide.fixed
    ? await highlight(await readCode(slide.fixed.file), slide.lang)
    : undefined
  const requests = []
  if (slide.requestExamples) {
    for (const example of slide.requestExamples.items) {
      requests.push({ title: example.title, html: await highlight(example.code, slide.requestExamples.lang) })
    }
  }

  const items = [
    {
      key: 'vulnerable',
      label: 'Уязвимо',
      children: <CodeBlock html={vulnerableHtml} />,
    },
    ...(fixedHtml && slide.fixed
      ? [
          {
            key: 'fixed',
            label: 'Исправлено',
            children: <CodeBlock html={fixedHtml} />,
          },
        ]
      : []),
  ]

  return (
    <div className={slide.requestExamples ? 'code-slide-with-requests' : undefined}>
      {slide.title && <SlideTitle level={2}>{slide.title}</SlideTitle>}
      <Tabs items={items} size="large" />
      {slide.requestExamples && <section className="request-examples" aria-label={slide.requestExamples.title}>
        <SlideTitle level={3}>{slide.requestExamples.title}</SlideTitle>
        <div className="request-examples-grid">
          {requests.map((request) => <section key={request.title} aria-label={request.title}>
            <h4>{request.title}</h4>
            <CodeBlock html={request.html} />
          </section>)}
        </div>
        {slide.requestExamples.caption && <p className="request-caption">{slide.requestExamples.caption}</p>}
      </section>}
    </div>
  )
}
