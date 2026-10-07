import { describe, it, expect } from 'vitest'
import { ModuleSchema, SlideSchema } from './schema'

describe('SlideSchema', () => {
  it('accepts a title slide', () => {
    expect(() => SlideSchema.parse({ type: 'title', title: 'XSS' })).not.toThrow()
  })

  it('accepts optional notes on any slide', () => {
    expect(() =>
      SlideSchema.parse({ type: 'title', title: 'XSS', notes: 'скажи про BA' }),
    ).not.toThrow()
  })

  it('accepts a demo slide with mode and route', () => {
    expect(() =>
      SlideSchema.parse({ type: 'demo', route: '/site/comments', mode: 'vulnerable' }),
    ).not.toThrow()
  })

  it('rejects a demo slide with bad mode', () => {
    expect(() =>
      SlideSchema.parse({ type: 'demo', route: '/x', mode: 'nope' }),
    ).toThrow()
  })

  it('rejects a demo slide without route', () => {
    expect(() => SlideSchema.parse({ type: 'demo', mode: 'fixed' })).toThrow()
  })

  it('accepts a bullets slide', () => {
    expect(() =>
      SlideSchema.parse({ type: 'bullets', title: 'Что', items: ['a', 'b'] }),
    ).not.toThrow()
  })

  it('rejects bullets with empty items', () => {
    expect(() =>
      SlideSchema.parse({ type: 'bullets', title: 'Что', items: [] }),
    ).toThrow()
  })

  it('accepts a code slide referencing files', () => {
    expect(() =>
      SlideSchema.parse({
        type: 'code',
        lang: 'tsx',
        vulnerable: { file: 'features/vulnerabilities/xss/XssInject.tsx' },
        fixed: { file: 'features/vulnerabilities/xss/FixedXssInject.tsx' },
      }),
    ).not.toThrow()
  })

  it('accepts a story slide', () => {
    expect(() =>
      SlideSchema.parse({ type: 'story', quote: '380 000 карт', source: 'BA 2018' }),
    ).not.toThrow()
  })

  it('accepts two-columns and timeline', () => {
    expect(() =>
      SlideSchema.parse({
        type: 'two-columns',
        title: 'До/после',
        left: { title: 'A', body: 'a' },
        right: { title: 'B', body: 'b' },
      }),
    ).not.toThrow()
    expect(() =>
      SlideSchema.parse({
        type: 'timeline',
        title: 'Хронология',
        steps: [{ title: 's1', text: 't1' }],
      }),
    ).not.toThrow()
  })

  it('accepts a checklist slide', () => {
    expect(() =>
      SlideSchema.parse({ type: 'checklist', title: 'Чеклист', items: ['x'] }),
    ).not.toThrow()
  })

  it('rejects an unknown slide type', () => {
    expect(() => SlideSchema.parse({ type: 'video', src: 'x' })).toThrow()
  })
})

describe('ModuleSchema', () => {
  it('accepts a full module', () => {
    expect(() =>
      ModuleSchema.parse({
        id: 'xss',
        title: 'XSS',
        meta: { cwe: 'CWE-79', cvss: '6.1', owasp: 'A03:2021' },
        slides: [{ type: 'title', title: 'XSS' }],
      }),
    ).not.toThrow()
  })

  it('accepts a module without meta', () => {
    expect(() =>
      ModuleSchema.parse({ id: 'x', title: 'X', slides: [{ type: 'title', title: 'X' }] }),
    ).not.toThrow()
  })

  it('rejects a module with empty slides', () => {
    expect(() => ModuleSchema.parse({ id: 'x', title: 'X', slides: [] })).toThrow()
  })
})
