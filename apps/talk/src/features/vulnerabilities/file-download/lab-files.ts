import { mkdtemp, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { LabError } from '@/features/backend-lab/server'

type Files = { directory: string; read: (path: string) => Promise<string> }
const globalFiles = globalThis as unknown as { __downloadLab?: Promise<Files> }

export function getLabFiles(): Promise<Files> {
  return globalFiles.__downloadLab ??= (async () => {
    const root = await mkdtemp(join(tmpdir(), 'websecurity-files-'))
    const directory = join(root, 'downloads')
    await mkdir(directory)
    const manual = join(directory, 'manual.txt')
    const secret = join(root, 'internal.txt')
    await writeFile(manual, 'Инструкция: отключите питание перед монтажом. Учебный документ.', 'utf8')
    await writeFile(secret, 'ВНУТРЕННИЙ ФАЙЛ\nDEMO_SERVICE_TOKEN=fictional-not-a-real-secret\nЭтот файл не предназначен для скачивания.', 'utf8')
    // Файлы создаются в runtime, их не нужно искать и включать в сборку.
    const allowed = new Set(await Promise.all([manual, secret].map((file) => realpath(/* turbopackIgnore: true */ file))))
    const lexicalPaths = new Set([resolve(manual), resolve(secret)])
    return { directory, read: async (path: string) => {
      // Страховка лаборатории в ОБОИХ режимах. Файлы компьютера недоступны.
      if (!lexicalPaths.has(resolve(path))) throw new LabError(403, 'Путь запрещён стендом.')
      const actual = await realpath(path)
      if (!allowed.has(actual)) throw new LabError(403, 'За пределами двух учебных файлов чтение запрещено стендом.')
      return readFile(actual, 'utf8')
    } }
  })().catch((error) => { delete globalFiles.__downloadLab; throw error })
}
