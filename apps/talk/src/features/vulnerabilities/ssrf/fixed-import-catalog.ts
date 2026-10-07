import { LabError } from '@/features/backend-lab/server'
import { SUPPLIER_URL, REDIRECT_URL, type RequestText } from './targets'

export async function fixedImportCatalog(url: string, requestText: RequestText) {
  // ИСПРАВЛЕНО: для этой функции нужны только известные адреса поставщика.
  const allowedUrls = new Set([SUPPLIER_URL, REDIRECT_URL])
  if (!allowedUrls.has(new URL(url).href)) {
    throw new LabError(403, 'Этот URL не входит в список источников каталога.')
  }
  // Даже разрешённый поставщик не должен перенаправить сервер во внутреннюю сеть.
  return requestText(url, { redirect: 'error' })
}
