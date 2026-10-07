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

  it('covers all source slides and exposes the implemented live demos', async () => {
    const modules = await loadModules(resolveSlidesDir())
    const slides = modules.flatMap((module) => module.slides)
    expect(slides.flatMap((slide) => slide.sourceSlide ? [slide.sourceSlide] : [])).toEqual(
      Array.from({ length: 17 }, (_, index) => index + 1),
    )
    const demos = modules.flatMap((module) => module.slides
      .filter((slide) => slide.type === 'demo')
      .map((slide) => ({ moduleId: module.id, route: slide.route, mode: slide.mode })))
    expect(demos).toEqual([
      { moduleId: 'xss', route: '/site/comments', mode: 'vulnerable' },
      { moduleId: 'csrf', route: '/site/delivery', mode: 'vulnerable' },
      { moduleId: 'dependencies', route: '/site/product', mode: 'vulnerable' },
    ])
    const topics = slides.filter((slide) => slide.type === 'vulnerability')
    expect(topics.filter((slide) => slide.section === 'frontend')).toHaveLength(7)
    expect(topics.filter((slide) => slide.section === 'backend')).toHaveLength(5)
    const agenda = slides.find((slide) => slide.type === 'agenda')!
    expect(agenda.groups.flatMap((group) => group.items.map((item) => item.moduleId))).toEqual(
      modules.filter((module) => module.slides.some((slide) => slide.type === 'vulnerability')).map((module) => module.id),
    )
  })
})
