// @vitest-environment node
import { describe, it, expect, vi, afterAll } from 'vitest'
import { SUPPLIER_URL, INTERNAL_URL, REDIRECT_URL } from './targets'
import { labRequestText, getLabNetwork } from './lab-network'
import { importCatalog } from './import-catalog'
import { fixedImportCatalog } from './fixed-import-catalog'

afterAll(async () => { (await getLabNetwork()).server.close() })
describe('SSRF over real loopback HTTP', () => {
  it('loads a legitimate supplier in both modes', async () => {
    for (const load of [importCatalog, fixedImportCatalog]) {
      const result = await load(SUPPLIER_URL, labRequestText)
      expect(result.body).toContain('Кабель')
      expect(result.trace).toHaveLength(1)
    }
  })
  it('leaks internal records directly and through a redirect in vulnerable mode', async () => {
    expect((await importCatalog(INTERNAL_URL, labRequestText)).body).toContain('salary')
    const result = await importCatalog(REDIRECT_URL, labRequestText)
    expect(result.body).toContain('salary')
    expect(result.trace).toHaveLength(2)
  })
  it.each([INTERNAL_URL, 'http://supplier.example.test.evil.test/catalog.json', 'http://supplier.example.test@evil.test/catalog.json', `${SUPPLIER_URL}?url=internal`, 'file:///etc/passwd', 'http://127.0.0.1/'])('rejects %s before sending', async (url) => {
    const request = vi.fn()
    await expect(fixedImportCatalog(url, request)).rejects.toThrow()
    expect(request).not.toHaveBeenCalled()
  })
  it('blocks redirects and arbitrary network destinations', async () => {
    await expect(fixedImportCatalog(REDIRECT_URL, labRequestText)).rejects.toThrow('редиректом')
    await expect(importCatalog('http://169.254.169.254/', labRequestText)).rejects.toThrow('три подготовленных')
  })
})
