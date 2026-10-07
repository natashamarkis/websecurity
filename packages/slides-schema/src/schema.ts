import { z } from 'zod'

/** Поля, общие для всех типов слайдов. */
const base = {
  /** Заметки докладчика. Видны только в режиме докладчика. */
  notes: z.string().optional(),
}

const codeRef = z.object({
  /** Путь к файлу относительно apps/talk/src, например features/vuln-xss/render.vulnerable.tsx */
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
  lang: z.string().min(1),
  vulnerable: codeRef,
  fixed: codeRef.optional(),
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

export const SlideSchema = z.discriminatedUnion('type', [
  TitleSlideSchema,
  BulletsSlideSchema,
  CodeSlideSchema,
  StorySlideSchema,
  DemoSlideSchema,
  ChecklistSlideSchema,
  TwoColumnsSlideSchema,
  TimelineSlideSchema,
])

export const ModuleMetaSchema = z.object({
  cwe: z.string().optional(),
  cvss: z.string().optional(),
  owasp: z.string().optional(),
})

export const ModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  meta: ModuleMetaSchema.optional(),
  slides: z.array(SlideSchema).min(1),
})

export type Slide = z.infer<typeof SlideSchema>
export type SlideType = Slide['type']
export type Module = z.infer<typeof ModuleSchema>
export type ModuleMeta = z.infer<typeof ModuleMetaSchema>
