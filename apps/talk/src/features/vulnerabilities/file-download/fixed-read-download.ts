import { isAbsolute, relative, resolve, sep } from 'node:path'
import { realpath } from 'node:fs/promises'
import { LabError } from '@/features/backend-lab/server'

export async function fixedReadDownload(directory: string, filename: string, read: (path: string) => Promise<string>) {
  const root = await realpath(directory)
  const file = await realpath(resolve(root, filename))
  const pathFromRoot = relative(root, file)
  // ИСПРАВЛЕНО: проверяем реальный путь, включая символические ссылки.
  if (isAbsolute(pathFromRoot) || pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`)) {
    throw new LabError(403, 'Файл находится вне папки загрузок.')
  }
  return read(file)
}
