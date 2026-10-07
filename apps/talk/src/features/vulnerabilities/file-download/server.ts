import { z } from 'zod'
import { LabError, labHandler } from '@/features/backend-lab/server'
import { documents } from './documents'
import { getDocument } from './get-document'
import { fixedGetDocument } from './fixed-get-document'
import { getLabFiles } from './lab-files'
import { readDownload } from './read-download'
import { fixedReadDownload } from './fixed-read-download'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('document'), documentId: z.string().max(100) }).strict(),
  z.object({ action: z.literal('path'), filename: z.string().min(1).max(200) }).strict(),
])
export const handleFiles = labHandler('file-download', async (input, context) => {
  const command = schema.parse(input)
  if (command.action === 'document') {
    const document = context.mode === 'vulnerable'
      ? getDocument(documents, 'alex', command.documentId)
      : fixedGetDocument(documents, 'alex', command.documentId)
    if (!document) return { status: 404, message: 'Документ не найден или недоступен.' }
    return { status: 200, message: document.name, content: document.content, filename: `invoice-${document.id}.txt` }
  }
  if (!['manual.txt', '../internal.txt'].includes(command.filename)) {
    throw new LabError(400, 'Стенд разрешает только manual.txt и ../internal.txt. Файлы компьютера недоступны.')
  }
  const files = await getLabFiles()
  const content = context.mode === 'vulnerable'
    ? await readDownload(files.directory, command.filename, files.read)
    : await fixedReadDownload(files.directory, command.filename, files.read)
  return { status: 200, message: 'Сервер прочитал файл.', content, filename: 'document.txt' }
})
