import { ModuleSchema } from './schema'

export interface ModuleInput {
  /** имя файла-источника, для сообщений об ошибках */
  file: string
  /** распарсенный JSON модуля */
  data: unknown
}

export interface ValidateOptions {
  /** Проверка существования файлов из code.file (путь относительно apps/talk/src). */
  fileExists?: (relativeFile: string) => boolean
}

export type ValidateResult = { ok: true } | { ok: false; errors: string[] }

/**
 * Валидирует набор модулей по ModuleSchema и, если передан fileExists,
 * проверяет, что файлы из слайдов типа `code` реально существуют.
 */
export function validateModules(modules: ModuleInput[], options: ValidateOptions = {}): ValidateResult {
  const errors: string[] = []

  for (const { file, data } of modules) {
    const parsed = ModuleSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        errors.push(`${file}: ${path || '<root>'} — ${issue.message}`)
      }
      continue
    }

    if (options.fileExists) {
      parsed.data.slides.forEach((slide, i) => {
        if (slide.type !== 'code') return
        const refs = [slide.vulnerable.file, slide.fixed?.file].filter((f): f is string => Boolean(f))
        for (const ref of refs) {
          if (!options.fileExists!(ref)) {
            errors.push(`${file}: slides.${i} — code.file not found: ${ref}`)
          }
        }
      })
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
