import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Корень исходников приложения. В dev/test cwd = apps/talk.
 * Можно переопределить через TALK_SRC_DIR (например, в CI).
 */
export function resolveSrcDir(): string {
  return path.resolve(process.env.TALK_SRC_DIR ?? path.join(process.cwd(), 'src'))
}

/**
 * Читает файл по пути относительно src/ для слайда типа `code`.
 * Запрещает выход за пределы src/ (../ и абсолютные пути) — сами показываем
 * path traversal в докладе, значит, у себя его быть не должно.
 */
export async function readCode(relativeFile: string): Promise<string> {
  const srcDir = resolveSrcDir()
  const target = path.resolve(srcDir, relativeFile)
  const rel = path.relative(srcDir, target)

  const escapes = rel === '' || rel.startsWith('..') || path.isAbsolute(rel)
  if (escapes) {
    throw new Error(`code.file points outside src/: ${relativeFile}`)
  }

  try {
    return await readFile(target, 'utf8')
  } catch {
    throw new Error(`code.file not found: ${relativeFile}`)
  }
}
