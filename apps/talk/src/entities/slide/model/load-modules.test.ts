import { describe, it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadModules, resolveSlidesDir } from './load-modules'

async function makeContentDir(files: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'slides-'))
  const dir = path.join(root, 'content', 'slides')
  await mkdir(dir, { recursive: true })
  for (const [name, data] of Object.entries(files)) {
    await writeFile(path.join(dir, name), JSON.stringify(data), 'utf8')
  }
  return dir
}

const validModule = {
  id: 'intro',
  title: 'Введение',
  slides: [{ type: 'title', title: 'Hi' }],
}

describe('loadModules', () => {
  it('loads modules listed in index.json in order', async () => {
    const dir = await makeContentDir({
      'index.json': { modules: ['b.json', 'a.json'] },
      'a.json': { ...validModule, id: 'a' },
      'b.json': { ...validModule, id: 'b' },
    })
    const modules = await loadModules(dir)
    expect(modules.map((m) => m.id)).toEqual(['b', 'a'])
  })

  it('throws a readable error when a module fails validation', async () => {
    const dir = await makeContentDir({
      'index.json': { modules: ['bad.json'] },
      'bad.json': { id: 'bad', title: 'Bad', slides: [] },
    })
    await expect(loadModules(dir)).rejects.toThrow(/bad\.json/)
  })

  it('throws when index references a missing file', async () => {
    const dir = await makeContentDir({
      'index.json': { modules: ['nope.json'] },
    })
    await expect(loadModules(dir)).rejects.toThrow(/nope\.json/)
  })

  it('loads the real repo content without errors', async () => {
    const modules = await loadModules(resolveSlidesDir())
    expect(modules.length).toBeGreaterThan(0)
    expect(modules[0]?.id).toBe('intro')
  })
})
