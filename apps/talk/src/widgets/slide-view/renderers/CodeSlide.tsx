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
 * Слайд всегда показывает тот код, который на самом деле исполняется в демо.
 */
export async function CodeSlide({ slide }: { slide: CodeSlideData }) {
  const vulnerableHtml = await highlight(await readCode(slide.vulnerable.file), slide.lang)
  const fixedHtml = slide.fixed
    ? await highlight(await readCode(slide.fixed.file), slide.lang)
    : undefined

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
    <>
      {slide.title && <SlideTitle level={2}>{slide.title}</SlideTitle>}
      <Tabs items={items} size="large" />
    </>
  )
}
