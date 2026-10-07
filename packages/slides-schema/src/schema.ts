import { z } from 'zod'

/** Поля, общие для всех типов слайдов. */
const base = {
  /** Заметки докладчика. Видны только в режиме докладчика. */
  notes: z.string().optional(),
  sourceSlide: z.number().int().min(1).optional(),
}

const codeRef = z.object({
  /** Путь к файлу относительно apps/talk/src, например features/vulnerabilities/xss/XssInject.tsx */
  file: z.string().min(1),
})

const column = z.object({
  title: z.string().min(1),
  /** markdown-подмножество: жирный, код, списки */
  body: z.string().min(1),
})

const timelineStep = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
})

export const TitleSlideSchema = z.object({
  ...base,
  type: z.literal('title'),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  moduleNo: z.number().int().optional(),
  variant: z.enum(['cover', 'section', 'closing']).optional(),
  image: z.string().optional(),
})

export const BulletsSlideSchema = z.object({
  ...base,
  type: z.literal('bullets'),
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  image: z.string().optional(),
})

export const CodeSlideSchema = z.object({
  ...base,
  type: z.literal('code'),
  title: z.string().optional(),
  caption: z.string().min(1).optional(),
  lang: z.string().min(1),
  vulnerable: codeRef,
  fixed: codeRef.optional(),
  requestExamples: z.object({
    title: z.string().min(1),
    lang: z.string().min(1),
    /** Примеры для вкладок: сначала vulnerable, затем fixed. */
    items: z.array(z.object({ title: z.string().min(1), code: z.string().min(1) })).length(2),
    caption: z.string().min(1).optional(),
  }).optional(),
})

export const StorySlideSchema = z.object({
  ...base,
  type: z.literal('story'),
  quote: z.string().min(1),
  source: z.string().optional(),
})

export const DemoSlideSchema = z.object({
  ...base,
  type: z.literal('demo'),
  route: z.string().min(1),
  mode: z.enum(['vulnerable', 'fixed']),
  caption: z.string().optional(),
  payload: z.string().optional(),
})

export const ChecklistSlideSchema = z.object({
  ...base,
  type: z.literal('checklist'),
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
})

export const TwoColumnsSlideSchema = z.object({
  ...base,
  type: z.literal('two-columns'),
  title: z.string().min(1),
  left: column,
  right: column,
})

export const TimelineSlideSchema = z.object({
  ...base,
  type: z.literal('timeline'),
  title: z.string().min(1),
  steps: z.array(timelineStep).min(1),
})

export const VulnerabilitySlideSchema = z.object({
  ...base,
  type: z.literal('vulnerability'),
  title: z.string().min(1),
  section: z.enum(['frontend', 'backend']),
  attack: z.array(z.string().min(1)).min(1),
  defense: z.array(z.string().min(1)).min(1),
  caseStudy: z.string().optional(),
  sourceUrl: z.url().optional(),
})

export const AgendaSlideSchema = z.object({
  ...base,
  type: z.literal('agenda'),
  title: z.string().min(1),
  groups: z.array(z.object({
    title: z.string().min(1),
    section: z.enum(['frontend', 'backend']),
    items: z.array(z.object({ title: z.string().min(1), moduleId: z.string().min(1) })).min(1),
  })).min(1),
})

export const SlideSchema = z.discriminatedUnion('type', [
  TitleSlideSchema,
  BulletsSlideSchema,
  CodeSlideSchema,
  StorySlideSchema,
  DemoSlideSchema,
  ChecklistSlideSchema,
  TwoColumnsSlideSchema,
  TimelineSlideSchema,
  VulnerabilitySlideSchema,
  AgendaSlideSchema,
])

export const ModuleMetaSchema = z.object({
  cwe: z.string().optional(),
  cvss: z.string().optional(),
  owasp: z.string().optional(),
})

export const ModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  section: z.enum(['frontend', 'backend']).optional(),
  meta: ModuleMetaSchema.optional(),
  slides: z.array(SlideSchema).min(1),
})

export type Slide = z.infer<typeof SlideSchema>
export type SlideType = Slide['type']
export type Module = z.infer<typeof ModuleSchema>
export type ModuleMeta = z.infer<typeof ModuleMetaSchema>
