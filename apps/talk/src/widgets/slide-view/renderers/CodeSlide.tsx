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
 * Основной блок показывает код или конфигурацию демо; примеры запросов берутся из слайда.
 */
export async function CodeSlide({ slide }: { slide: CodeSlideData }) {
  const vulnerableHtml = await highlight(await readCode(slide.vulnerable.file), slide.lang)
  const fixedHtml = slide.fixed
    ? await highlight(await readCode(slide.fixed.file), slide.lang)
    : undefined
  const requests: { title: string; html: string }[] = []
  const relatedHtml = slide.relatedCode ? [
    await highlight(await readCode(slide.relatedCode.vulnerable.file), slide.relatedCode.lang),
    await highlight(await readCode(slide.relatedCode.fixed.file), slide.relatedCode.lang),
  ] : []
  if (slide.requestExamples) {
    for (const example of slide.requestExamples.items) {
      requests.push({ title: example.title, html: await highlight(example.code, slide.requestExamples.lang) })
    }
  }

  const panel = (html: string, requestIndex: 0 | 1) => {
    const request = requests[requestIndex]
    const related = relatedHtml[requestIndex]
    return <>
      <div className="backend-code"><CodeBlock html={html} /></div>
      {slide.relatedCode && related && <section className="related-code" aria-label={slide.relatedCode.title}>
        <SlideTitle level={3}>{slide.relatedCode.title}</SlideTitle>
        <CodeBlock html={related} />
      </section>}
      {slide.requestExamples && request && <section className="request-examples" aria-label={slide.requestExamples.title}>
        <SlideTitle level={3}>{slide.requestExamples.title}</SlideTitle>
        <section aria-label={request.title}>
          <h4>{request.title}</h4>
          <CodeBlock html={request.html} />
        </section>
        {slide.requestExamples.caption && <p className="request-caption">{slide.requestExamples.caption}</p>}
      </section>}
    </>
  }

  const items = [
    {
      key: 'vulnerable',
      label: 'Уязвимо',
      children: panel(vulnerableHtml, 0),
    },
    ...(fixedHtml && slide.fixed
      ? [
          {
            key: 'fixed',
            label: 'Исправлено',
            children: panel(fixedHtml, 1),
          },
        ]
      : []),
  ]

  return (
    <div className={[slide.requestExamples && 'code-slide-with-requests', slide.relatedCode && 'code-slide-with-related'].filter(Boolean).join(' ') || undefined}>
      {slide.title && <SlideTitle level={2}>{slide.title}</SlideTitle>}
      {slide.caption && <p className="code-caption">{slide.caption}</p>}
      <Tabs items={items} size="large" />
    </div>
  )
}
