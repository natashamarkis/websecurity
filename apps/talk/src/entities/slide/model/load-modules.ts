import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { ModuleSchema, type Module } from '@ws/slides-schema'

interface SlidesIndex {
  modules?: string[]
}

/**
 * Находит каталог content/slides.
 * Порядок: env SLIDES_DIR → подъём от cwd вверх (dev: cwd = apps/talk, CI: cwd = корень).
 */
export function resolveSlidesDir(): string {
  const fromEnv = process.env.SLIDES_DIR
  if (fromEnv) return path.resolve(fromEnv)

  let dir = process.cwd()
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(dir, 'content', 'slides')
    if (existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('content/slides not found: set SLIDES_DIR or run from the repo')
}

async function readJson(file: string): Promise<unknown> {
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    throw new Error(`slide file not found: ${path.basename(file)}`)
  }
  try {
    return JSON.parse(raw) as unknown
  } catch (err) {
    throw new Error(`invalid JSON in ${path.basename(file)}: ${(err as Error).message}`)
  }
}

/** Загружает и валидирует все модули из index.json, сохраняя порядок индекса. */
export async function loadModules(slidesDir: string = resolveSlidesDir()): Promise<Module[]> {
  const index = (await readJson(path.join(slidesDir, 'index.json'))) as SlidesIndex
  const files = index.modules ?? []

  const modules: Module[] = []
  for (const file of files) {
    const data = await readJson(path.join(slidesDir, file))
    const parsed = ModuleSchema.safeParse(data)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
        .join('; ')
      throw new Error(`invalid module ${file}: ${issues}`)
    }
    modules.push(parsed.data)
  }
  return modules
}

/** Удобный поиск модуля по id. */
export function findModule(modules: Module[], id: string): Module | undefined {
  return modules.find((m) => m.id === id)
}
