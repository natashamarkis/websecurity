import { z } from 'zod'

const settingsSchema = z.object({
  view: z.object({
    sort: z.enum(['name', 'price']),
    pageSize: z.number().int().min(1).max(100),
  }).strict(),
}).strict()

export function fixedMergeCatalogSettings(target: Record<string, unknown>, input: unknown) {
  const { view } = settingsSchema.parse(input)
  // Только разрешённые поля. Не обходим произвольные ключи и пути.
  target.view = { sort: view.sort, pageSize: view.pageSize }
  return target
}
