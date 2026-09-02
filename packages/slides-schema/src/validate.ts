import { ModuleSchema } from './schema'

export interface ModuleInput {
  /** имя файла-источника, для сообщений об ошибках */
  file: string
  /** распарсенный JSON модуля */
  data: unknown
}

export type ValidateResult = { ok: true } | { ok: false; errors: string[] }

/**
 * Валидирует набор модулей по ModuleSchema.
 * Проверку существования файлов из code.file делает вызывающая сторона (CLI),
 * т.к. она зависит от файловой системы приложения.
 */
export function validateModules(modules: ModuleInput[]): ValidateResult {
  const errors: string[] = []

  for (const { file, data } of modules) {
    const parsed = ModuleSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        errors.push(`${file}: ${path || '<root>'} — ${issue.message}`)
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
