import { resolve } from 'node:path'

export async function readDownload(directory: string, filename: string, read: (path: string) => Promise<string>) {
  // УЯЗВИМО: resolve нормализует ../, но не запрещает выход из папки.
  return read(resolve(directory, filename))
}
