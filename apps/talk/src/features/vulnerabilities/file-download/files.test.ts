// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { join } from 'node:path'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { documents } from './documents'
import { getDocument } from './get-document'
import { fixedGetDocument } from './fixed-get-document'
import { getLabFiles } from './lab-files'
import { readDownload } from './read-download'
import { fixedReadDownload } from './fixed-read-download'

describe('document ownership', () => {
  it('leaks another customer document only in vulnerable mode', () => {
    expect(getDocument(documents, 'alex', '1002')?.ownerId).toBe('maria')
    expect(fixedGetDocument(documents, 'alex', '1002')).toBeNull()
    expect(fixedGetDocument(documents, 'alex', '1001')?.ownerId).toBe('alex')
    expect(fixedGetDocument(documents, 'alex', 'unknown')).toBeNull()
    expect(fixedGetDocument(documents, '', '1001')).toBeNull()
  })
})
describe('real file traversal', () => {
  it('reads only the two lab files and blocks traversal in fixed mode', async () => {
    const lab = await getLabFiles()
    for (const read of [readDownload, fixedReadDownload]) {
      expect(await read(lab.directory, 'manual.txt', lab.read)).toContain('Инструкция')
    }
    expect(await readDownload(lab.directory, '../internal.txt', lab.read)).toContain('DEMO_SERVICE_TOKEN')
    await expect(fixedReadDownload(lab.directory, '../internal.txt', lab.read)).rejects.toThrow('вне папки')
    await expect(lab.read(join(lab.directory, '../../real-secret.txt'))).rejects.toThrow('запрещён')
  })
  it('rejects sibling-prefix paths and directory symlinks before reading', async () => {
    const root = await mkdtemp(join(tmpdir(), 'websecurity-path-test-'))
    try {
      const directory = join(root, 'downloads')
      const sibling = join(root, 'downloads-private')
      await mkdir(directory)
      await mkdir(sibling)
      await writeFile(join(sibling, 'secret.txt'), 'fictional')
      await symlink(sibling, join(directory, 'linked'), 'junction')
      const read = vi.fn()
      await expect(fixedReadDownload(directory, '../downloads-private/secret.txt', read)).rejects.toThrow('вне папки')
      await expect(fixedReadDownload(directory, 'linked/secret.txt', read)).rejects.toThrow('вне папки')
      expect(read).not.toHaveBeenCalled()
    } finally { await rm(root, { recursive: true, force: true }) }
  })
})
