import { z } from 'zod'
import { labHandler } from '@/features/backend-lab/server'
import { importCatalog } from './import-catalog'
import { fixedImportCatalog } from './fixed-import-catalog'
import { labRequestText } from './lab-network'

export const handleSsrf = labHandler('ssrf', async (input, context) => {
  const { url } = z.object({ url: z.url().max(300) }).strict().parse(input)
  const result = context.mode === 'vulnerable'
    ? await importCatalog(url, labRequestText)
    : await fixedImportCatalog(url, labRequestText)
  return { status: 200, message: 'Сервер загрузил содержимое по указанному URL.', ...result }
})
