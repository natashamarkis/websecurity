import { describe, it, expect } from 'vitest'
import { validateModules } from './validate'

const goodModule = {
  id: 'xss',
  title: 'XSS',
  slides: [{ type: 'title', title: 'XSS' }],
}

describe('validateModules', () => {
  it('returns ok for a valid set', () => {
    const res = validateModules([{ file: '01-xss.json', data: goodModule }])
    expect(res.ok).toBe(true)
  })

  it('returns errors for an invalid module and names the source file', () => {
    const res = validateModules([
      { file: '99-bad.json', data: { id: 'bad', title: 'Bad', slides: [] } },
    ])
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.errors.join('\n')).toContain('99-bad.json')
    }
  })

  it('reports slide index in the error path', () => {
    const res = validateModules([
      {
        file: '02-mix.json',
        data: {
          id: 'mix',
          title: 'Mix',
          slides: [{ type: 'title', title: 'ok' }, { type: 'demo', mode: 'vulnerable' }],
        },
      },
    ])
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.errors.join('\n')).toContain('slides')
      expect(res.errors.join('\n')).toContain('1')
    }
  })

  it('returns ok for an empty set', () => {
    expect(validateModules([]).ok).toBe(true)
  })

  it('reports code.file paths that do not exist when a checker is given', () => {
    const mod = {
      id: 'xss',
      title: 'XSS',
      slides: [
        {
          type: 'code',
          lang: 'tsx',
          vulnerable: { file: 'features/vuln-xss/render.vulnerable.tsx' },
          fixed: { file: 'features/vuln-xss/missing.tsx' },
        },
      ],
    }
    const exists = (file: string) => file.endsWith('render.vulnerable.tsx')
    const res = validateModules([{ file: '01-xss.json', data: mod }], { fileExists: exists })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.errors.join('\n')).toContain('missing.tsx')
      expect(res.errors.join('\n')).not.toContain('render.vulnerable.tsx')
    }
  })
})
